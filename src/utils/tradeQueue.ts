import { Trade, TradeResult } from '../types';
import { EventEmitter } from 'events';

export class TradeQueue {
  private static instance: TradeQueue;
  private queue: Trade[] = [];
  private processing: boolean = false;
  private processQueueMutex: Promise<void> = Promise.resolve(); // Mutex lock
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
      this.processQueueMutex = this.processQueueMutex.then(() => this.processQueue());
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    return new Promise<void>(resolve => { // Return a Promise
      this.processQueueInner().then(resolve).finally(() => {
        this.processing = false;
      });
    });
  }

  private async processQueueInner(): Promise<void> {
    
    try {
      console.log('processQueueInner started. Queue length:', this.queue.length); // ADDED LOGGING
      console.log('Current queue:', this.queue.map(trade => trade.id)); // ADDED LOGGING
+     console.log('Before while loop in processQueueInner. Queue length:', this.queue.length); // ADDED LOGGING
      while (this.queue.length > 0) { // Loop while queue has elements
        const trade = this.queue[0];
        console.log('Processing trade:', trade.id, 'Queue length before executeTrade:', this.queue.length); // ADDED LOGGING
+       console.log('Inside while loop, processing trade:', trade.id); // ADDED LOGGING
        let retries = 0;
        let success = false;

        while (retries < this.MAX_RETRIES && !success) {
          try {
            const result = await this.executeTrade(trade);
            if (result.success) {
              success = true;
              console.log('Before emitting tradeExecuted event'); // ADDED LOGGING
              this.eventEmitter.emit('tradeExecuted', result);
              console.log('After emitting tradeExecuted event'); // ADDED LOGGING
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
    // Mock implementation for testing trade failures
    if (trade.id === 'fail') {
      throw new Error('Simulated trade execution failure for testing');
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate trade execution delay
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
