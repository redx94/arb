import { EventEmitter } from 'events';
import type { PriceData, TradeDetails } from '../../types';
import { PriceFeed } from '../priceFeeds';
import { RiskManager } from '../riskManager';
import { Logger } from '../monitoring';
import { tradeExecutor } from '../tradeExecutor';

interface PriceDataWithAmount extends PriceData {
  amount: number;
}

export class ArbitrageEngine extends EventEmitter {
  private static instance: ArbitrageEngine;
  private running = false;
  private logger = Logger.getInstance();

  private constructor() {
    super();
  }

  public static getInstance(): ArbitrageEngine {
    if (!ArbitrageEngine.instance) {
      ArbitrageEngine.instance = new ArbitrageEngine();
    }
    return ArbitrageEngine.instance;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.emit('started');
    PriceFeed.getInstance().subscribe(this.handlePrice);
  }

  public stop() {
    if (!this.running) return;
    this.running = false;
    this.emit('stopped');
    PriceFeed.getInstance().unsubscribe(this.handlePrice);
  }

  public isRunning(): boolean {
    return this.running;
  }

  private handlePrice = async (data: PriceData) => {
    try {
      const profitThreshold = parseFloat(process.env.PROFIT_THRESHOLD || '1'); // 1% threshold
      const diff = Math.abs(data.cex - data.dex) / Math.min(data.cex, data.dex) * 100;
      if (diff >= profitThreshold) {
        console.log(`Arbitrage opportunity detected: dex=${data.dex}, cex=${data.cex}, diff=${diff}`);
        this.logger.info(`Arbitrage opportunity detected: dex=${data.dex}, cex=${data.cex}`);
        this.emit('arbitrageOpportunity', data);
        const tradeAmount = data.amount !== undefined ? String(data.amount) : '1'; // Use amount from PriceData or default to '1'
        // Check risk management
        const dataWithAmount: PriceDataWithAmount = { ...data, amount: parseFloat(tradeAmount) };
        await RiskManager.getInstance().validateTrade(dataWithAmount);

        // Execute trade
        const dexPriceBigInt = BigInt(Math.round(data.dex));
        const tradeResult = await tradeExecutor.executeTrade('BUY', 'ExamplePlatform', tradeAmount, dexPriceBigInt);

        if (tradeResult.success) {
          this.logger.info(`Trade executed successfully: id=${tradeResult.trade?.id}`);
          this.emit('tradeExecuted', tradeResult.trade);
        } else {
          this.logger.error(`Trade execution failed: ${tradeResult.error}`);
          this.emit('error', tradeResult.error);
        }
      }
    } catch (error: any) {
      this.logger.error('Error in handlePrice:', error instanceof Error ? error : new Error(String(error)));
      this.emit('error', error);
    }
  };
}
