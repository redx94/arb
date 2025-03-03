import axios from 'axios';
import type { PriceData } from '../types';

export class PriceFeed {
  private static instance: PriceFeed;
  private subscribers: { [key: string]: (data: any) => void } = {};
  private mockMode: boolean = true;
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
    // Fetch current price from CoinGecko API
    try {
      const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
      console.log('Fetching price from CoinGecko API:', apiUrl);
      const response = await axios.get(apiUrl);
      console.log('CoinGecko API response:', response.data);
      const data = response.data.ethereum;
      const price = data.usd;

      return {
        token: 'ETH',
        price: price,
        dex: price, // Assuming DEX price is the same as the general price
        cex: price, // Assuming CEX price is the same as the general price
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to fetch price from CoinGecko API:', error);
      return {
        token: 'ETH',
        price: 0,
        dex: 0,
        cex: 0,
        timestamp: Date.now(),
      };
    }
  }
}
