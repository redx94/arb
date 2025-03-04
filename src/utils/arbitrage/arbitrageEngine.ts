import { EventEmitter } from 'events';
import type { PriceData, TradeDetails } from '../../types/index.js';
import { PriceFeed } from '../priceFeeds.js';
import { RiskManager } from '../riskManager.js';
import { Logger } from '../monitoring.js';
import { tradeExecutor } from '../tradeExecutor.js';

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

      // Fetch platform-specific prices
      const dexPriceData = await PriceFeed.getInstance().getCurrentPrice('dex');
      const cexPriceData = await PriceFeed.getInstance().getCurrentPrice('cex');

      if (!dexPriceData || !cexPriceData) {
        this.logger.error('Failed to fetch dex or cex price data.');
        return;
      }

      const diff = Math.abs(cexPriceData.price - dexPriceData.price) / Math.min(dexPriceData.price, cexPriceData.price) * 100;
      if (diff >= profitThreshold) {
        console.log(`Arbitrage opportunity detected: dex=${dexPriceData.price}, cex=${cexPriceData.price}, diff=${diff}`);
        this.logger.info(`Arbitrage opportunity detected: dex=${dexPriceData.price}, cex=${cexPriceData.price}`);
        this.emit('arbitrageOpportunity', { dex: dexPriceData.price, cex: cexPriceData.price }); // Emit price data
        const tradeAmount = data.amount !== undefined ? String(data.amount) : '1'; // Use amount from PriceData or default to '1'
        // Check risk management
        const dataWithAmount: PriceDataWithAmount = { ...data, amount: parseFloat(tradeAmount) };
        await RiskManager.getInstance().validateTrade(dataWithAmount);

        // Execute trade - Assuming buying on DEX and selling on CEX for arbitrage
        const dexPriceBigInt = BigInt(Math.round(dexPriceData.price));
        const tradeResult = await tradeExecutor.executeTrade('BUY', 'DEXPlatform', tradeAmount, dexPriceBigInt); // Assuming 'DEXPlatform' for DEX trades

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
