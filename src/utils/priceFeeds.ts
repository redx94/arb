import type { PriceData } from '../types';

export class PriceFeed {
  private static instance: PriceFeed;
  private subscribers: { [key: string]: (data: any) => void } = {};
  private mockMode: boolean = false;
  private mockData: PriceData[] = [];

  private constructor() {}

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
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers[id] = callback;
    return () => delete this.subscribers[id];
  }

  public updatePrice(data: PriceData): void {
    if (this.mockMode) {
      this.mockData.push(data);
    } else {
      Object.values(this.subscribers).forEach(callback => callback(data));
    }
  }

  public unsubscribe(callback: (data: any) => void): void {
    // Remove the callback from the listeners array
    this.subscribers = Object.fromEntries(Object.entries(this.subscribers).filter(([, func]) => func !== callback));
  }

  public async getCurrentPrice(): Promise<PriceData> {
    // Dummy implementation for getting current price
    return this.mockMode
      ? {
          token: '',
          price: 0,
          dex: Math.random() * 1000,
          cex: Math.random() * 1000,
          timestamp: Date.now(),
        }
      : {
          token: '',
          price: 0,
          dex: Math.random() * 1000,
          cex: Math.random() * 1000,
          timestamp: Date.now(),
        };
  }
}
