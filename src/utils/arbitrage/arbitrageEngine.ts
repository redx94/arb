import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { PriceFeed } from '../priceFeeds';
import { RiskManager } from '../riskManager';
import { TradeQueue } from '../tradeQueue';
import { FlashLoanHandler } from '../flashLoanHandler';
import { LiquidityAnalyzer } from '../liquidityAnalyzer';
import { PerformanceMonitor } from '../monitoring';
import { ErrorHandler } from '../errors/ErrorHandler';
import { PerformanceCache } from '../cache/PerformanceCache';
import { Logger } from '../monitoring';
import type { PriceData, Trade } from '../../types';

const logger = Logger.getInstance();

export class ArbitrageEngine {
  private static instance: ArbitrageEngine;
  private readonly eventEmitter = new EventEmitter();
  private readonly priceFeed = PriceFeed.getInstance();
  private readonly riskManager = RiskManager.getInstance();
  private readonly tradeQueue = TradeQueue.getInstance();
  private readonly flashLoanHandler = FlashLoanHandler.getInstance();
  private readonly liquidityAnalyzer = LiquidityAnalyzer.getInstance();
  private readonly performanceMonitor = PerformanceMonitor.getInstance();
  private readonly errorHandler = ErrorHandler.getInstance();
  private readonly priceCache = new PerformanceCache<PriceData>({ ttl: 1000 });
  
  private readonly MIN_PROFIT_THRESHOLD = 0.002; // 0.2%
  private readonly MAX_EXECUTION_TIME = 500; // 500ms
  private readonly TARGET_SUCCESS_RATE = 0.95; // 95%
  private readonly MAX_SLIPPAGE = 0.005; // 0.5%
  private isRunning = false;
  private priceUpdateHandler: ((data: PriceData) => void) | null = null;
  private tradeExecutedHandler: ((result: { trade: Trade }) => void) | null = null;
  private tradeFailedHandler: ((error: Error) => void) | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): ArbitrageEngine {
    if (!ArbitrageEngine.instance) {
      ArbitrageEngine.instance = new ArbitrageEngine();
    }
    return ArbitrageEngine.instance;
  }

  private setupEventListeners(): void {
    try {
      // Store handler references for cleanup
      this.priceUpdateHandler = this.onPriceUpdate.bind(this);
      this.tradeExecutedHandler = this.onTradeExecuted.bind(this);
      this.tradeFailedHandler = this.onTradeFailed.bind(this);

      // Subscribe with stored references
      this.priceFeed.subscribe(this.priceUpdateHandler);
      this.tradeQueue.on('tradeExecuted', this.tradeExecutedHandler);
      this.tradeQueue.on('tradeFailed', this.tradeFailedHandler);
    } catch (error) {
      logger.error('Failed to setup event listeners:', error);
      throw error;
    }
  }

  private async onPriceUpdate(priceData: PriceData): Promise<void> {
    if (!this.isRunning) return;

    this.performanceMonitor.startTimer('priceAnalysis');
    
    try {
      const arbitrageOpportunity = await this.errorHandler.withRetry(
        () => this.analyzeArbitrageOpportunity(priceData),
        'Arbitrage analysis'
      );

      if (arbitrageOpportunity) {
        await this.executeArbitrage(arbitrageOpportunity);
      }
    } catch (error) {
      logger.error('Price update handling failed:', error);
      this.eventEmitter.emit('error', error);
    } finally {
      this.performanceMonitor.endTimer('priceAnalysis');
    }
  }

  private async analyzeArbitrageOpportunity(priceData: PriceData): Promise<Trade | null> {
    const priceDiff = Math.abs(priceData.dex - priceData.cex);
    const profitPercentage = priceDiff / Math.min(priceData.dex, priceData.cex);

    if (profitPercentage < this.MIN_PROFIT_THRESHOLD) {
      return null;
    }

    // Use WETH address for liquidity analysis
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    
    // Calculate optimal trade size based on liquidity
    const liquidityAnalysis = await this.liquidityAnalyzer.analyzeLiquidity(
      WETH_ADDRESS,
      '1.0',
      priceData
    );

    if (!liquidityAnalysis.safe || liquidityAnalysis.priceImpact > this.MAX_SLIPPAGE) {
      return null;
    }

    const isDexCheaper = priceData.dex < priceData.cex;
    
    return {
      id: crypto.randomUUID(),
      type: isDexCheaper ? 'BUY' : 'SELL',
      platform: isDexCheaper ? 'DEX' : 'CEX',
      amount: ethers.parseEther('1.0'),
      price: isDexCheaper ? priceData.dex : priceData.cex,
      timestamp: Date.now(),
      status: 'PENDING'
    };
  }

  private async executeArbitrage(trade: Trade): Promise<void> {
    this.performanceMonitor.startTimer('tradeExecution');

    try {
      // Validate with risk manager
      const mockBalance = { 
        dexAmount: ethers.parseEther('10'), 
        cexAmount: ethers.parseEther('10'), 
        asset: 'ETH', 
        wallet: '', 
        pending: ethers.parseEther('0')
      };

      if (!this.riskManager.validateTrade(
        trade, 
        mockBalance, 
        await this.priceFeed.getCurrentPrice()
      )) {
        return;
      }

      // Execute flash loan if needed
      const flashLoanParams = {
        amount: trade.amount.toString(),
        token: 'ETH',
        protocol: 'AAVE',
        expectedProfit: (Number(ethers.formatEther(trade.amount)) * trade.price * 0.002).toString(),
        maxSlippage: this.MAX_SLIPPAGE,
        deadline: Math.floor(Date.now() / 1000) + 300 // 5 minutes
      };

      await this.flashLoanHandler.validateFlashLoan(flashLoanParams);
      
      // Add trade to queue
      await this.tradeQueue.addTrade(trade);
    } catch (error) {
      logger.error('Trade execution failed:', error);
      this.eventEmitter.emit('error', error);
    } finally {
      this.performanceMonitor.endTimer('tradeExecution');
    }
  }

  private onTradeExecuted(result: { trade: Trade }): void {
    const executionTime = this.performanceMonitor.getMetrics('tradeExecution').avg;
    if (executionTime > this.MAX_EXECUTION_TIME) {
      this.eventEmitter.emit('warning', 'Execution time exceeded threshold');
    }
  }

  private onTradeFailed(error: Error): void {
    logger.error('Trade failed:', error);
    this.eventEmitter.emit('error', error);
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('Engine already running');
      return;
    }
    this.isRunning = true;
    this.eventEmitter.emit('started');
  }

  public stop(): void {
    if (!this.isRunning) {
      logger.warn('Engine already stopped');
      return;
    }

    try {
      this.isRunning = false;

      // Clean up event listeners
      if (this.priceUpdateHandler) {
        this.priceFeed.unsubscribe(this.priceUpdateHandler);
        this.priceUpdateHandler = null;
      }

      if (this.tradeExecutedHandler) {
        this.tradeQueue.off('tradeExecuted', this.tradeExecutedHandler);
        this.tradeExecutedHandler = null;
      }

      if (this.tradeFailedHandler) {
        this.tradeQueue.off('tradeFailed', this.tradeFailedHandler);
        this.tradeFailedHandler = null;
      }

      this.eventEmitter.emit('stopped');
    } catch (error) {
      logger.error('Error stopping engine:', error);
      throw error;
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
}