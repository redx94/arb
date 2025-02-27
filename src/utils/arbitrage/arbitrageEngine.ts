import { EventEmitter } from 'events';
import type { PriceData } from '../../types';
import { PriceFeed } from '../priceFeeds';
import { RiskManager } from '../riskManager';

export class ArbitrageEngine extends EventEmitter {
  private static instance: ArbitrageEngine;
  private running = false;

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

  private handlePrice = (data: PriceData) => {
    try {
      const profitThreshold = 1; // 1% threshold
      const diff = Math.abs(data.cex - data.dex) / Math.min(data.cex, data.dex) * 100;
      if (diff >= profitThreshold) {
        // Optionally, check risk management
        RiskManager.getInstance().validateTrade(data, 0.1); // Example risk threshold
        this.emit('opportunity', data);
        // Simulate trade execution warning for slow execution if needed
        if (data.timestamp % 2 === 0) {
          this.emit('warning', 'Execution time limit exceeded');
        }
        this.emit('execution', { trade: data });
        // Add a delay to simulate execution time
        setTimeout(() => {
          this.emit('trade_executed', { trade: data });
        }, 1000);
      }
    } catch (error) {
      this.emit('error', error);
      this.emit('warning', (error as Error).message);
    }
  };
}
