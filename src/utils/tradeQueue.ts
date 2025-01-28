import { Trade, TradeResult } from '../types';
import { EventEmitter } from 'events';

export class TradeQueue {
  private static instance: TradeQueue;
  private queue: Trade[] = [];
  private processing: boolean = false;
  private readonly eventEmitter = new EventEmitter();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  private constructor() {}

  public static getInstance(): TradeQueue {
    if (!TradeQueue.instance) {
      TradeQueue.instance = new TradeQueue();
    }
    return TradeQueue.instance;
  }

  public async addTrade(trade: Trade): Promise<void> {
    this.queue.push(trade);
    this.eventEmitter.emit('tradeAdded', trade);
    
    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        const trade = this.queue[0];
        let retries = 0;
        let success = false;

        while (retries < this.MAX_RETRIES && !success) {
          try {
            const result = await this.executeTrade(trade);
            if (result.success) {
              success = true;
              this.eventEmitter.emit('tradeExecuted', result);
            } else {
              retries++;
              if (retries < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
              }
            }
          } catch (error) {
            retries++;
            if (retries === this.MAX_RETRIES) {
              this.eventEmitter.emit('tradeFailed', { trade, error });
            }
          }
        }

        this.queue.shift();
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeTrade(trade: Trade): Promise<TradeResult> {
    // Implementation of actual trade execution
    return {
      success: true,
      message: 'Trade executed successfully',
      trade
    };
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue = [];
    this.eventEmitter.emit('queueCleared');
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    this.eventEmitter.off(event, callback);
  }
}