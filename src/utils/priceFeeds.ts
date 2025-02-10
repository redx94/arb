import type { PriceData } from '../types';

export class PriceFeed {
  private static instance: PriceFeed;
  private mockMode: boolean = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): PriceFeed {
    if (!PriceFeed.instance) {
      PriceFeed.instance = new PriceFeed();
    }
    return PriceFeed.instance;
  }

  public setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  public subscribe(callback: (data: any) => void): () => void {
    // Dummy implementation for subscription
    const intervalId = setInterval(() => {
      const data = this.mockMode
        ? {
            dex: Math.random() * 1000,
            cex: Math.random() * 1000,
            timestamp: Date.now(),
          }
        : {
            dex: Math.random() * 1000,
            cex: Math.random() * 1000,
            timestamp: Date.now(),
          };
      callback(data);
    }, 1000);

    return () => clearInterval(intervalId);
  }

  public unsubscribe(callback: (data: any) => void): void {
    // Dummy implementation for unsubscription
    // This method should be implemented to remove the callback from the subscription list
  }

  public async getCurrentPrice(): Promise<PriceData> {
    // Dummy implementation for getting current price
    return this.mockMode
      ? {
          dex: Math.random() * 1000,
          cex: Math.random() * 1000,
          timestamp: Date.now(),
        }
      : {
          dex: Math.random() * 1000,
          cex: Math.random() * 1000,
          timestamp: Date.now(),
        };
  }
}
