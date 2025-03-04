import axios from 'axios';
import type { PriceData } from '../types/index.js';
import { EventEmitter } from 'events';
import { Logger } from './monitoring.js';

export class PriceFeed extends EventEmitter {
  private static instance: PriceFeed;
  private subscribers: { [key: string]: (data: any) => void } = {};
  private mockMode: boolean = false;
  private mockData: PriceData[] = [];
  private apiKey: string | null = process.env.COINGECKO_API_KEY || null;
  private apiBaseUrl: string = 'https://api.coingecko.com/api/v3';
  private logger = Logger.getInstance();

  private constructor() {
    super();
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
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers[id] = callback;
    return () => delete this.subscribers[id];
  }

  public updatePrice(data: PriceData): void {
    if (this.mockMode) {
      this.mockData.push(data);
      Object.values(this.subscribers).forEach(callback => callback(data)); // Still notify subscribers
    } else {
      Object.values(this.subscribers).forEach(callback => callback(data));
    }
  }

  public getMockData(): PriceData[] {
    return this.mockData;
  }

  private getApiUrl(endpoint: string, params?: Record<string, string>): string {
    let url = `${this.apiBaseUrl}${endpoint}`;
    const allParams = { ...params };
    if (this.apiKey) {
      allParams['api_key'] = this.apiKey;
    }
    const queryParams = new URLSearchParams(allParams).toString();
    return queryParams ? `${url}?${queryParams}` : url;
  }

  public async getCurrentPrice(platform: 'dex' | 'cex'): Promise<PriceData | null> {
    try {
      const apiUrl = this.getApiUrl(`/coins/ethereum`, { vs_currency: 'usd' });
      console.log(`Fetching price from CoinGecko API for ${platform}:`, apiUrl);
      this.logger.info(`Fetching price from CoinGecko API for ${platform}: ${apiUrl}`);
      const response = await axios.get(apiUrl, {
        // Future: Authentication headers can be added here if needed.
      });
      console.log('CoinGecko API response:', response.data);
      this.logger.info(`CoinGecko API response for ${platform}: ${JSON.stringify(response.data)}`);
      if (!response.data || !response.data.market_data || !response.data.market_data.current_price || !response.data.market_data.current_price.usd) {
        const errorMessage = 'Invalid response format from CoinGecko API';
        console.error(errorMessage, 'Response data:', response.data);
        this.logger.error(errorMessage, response.data);
        console.error(errorMessage, 'Response data:', response.data);
        return null;
      }
      const price = Number(Math.round(response.data.market_data.current_price.usd));

      return {
        token: 'ETH',
        price: price,
        dex: platform === 'dex' ? price : 0, // Assign price based on platform
        cex: platform === 'cex' ? price : 0, // Assign price based on platform
        timestamp: Date.now(),
        platform: platform, // Set the platform
        amount: 1,
      };
    } catch (error: any) {
      console.error(`Failed to fetch price from CoinGecko API for ${platform}:`, error);
      this.emit('error', `Failed to fetch price from CoinGecko API for ${platform}`, error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`CoinGecko API error for ${platform}: ${error.response.status} ${error.response.statusText}`, error.response.data);
        return null;
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error(`No response received from CoinGecko API for ${platform}: ${error.message}`);
        return null;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(`Error setting up CoinGecko API request for ${platform}: ${error.message}`);
        return null;
      }
    }
  }

  public async getHistoricalPrice(days: number = 30): Promise<any | null> {
    try {
      const apiUrl = this.getApiUrl(`/coins/ethereum/market_chart`, { vs_currency: 'usd', days: days.toString() });
      console.log('Fetching historical price from CoinGecko API:', apiUrl);
      const response = await axios.get(apiUrl, {
        // Future: Authentication headers can be added here if needed.
      });
      console.log('CoinGecko API response:', response.data);
      if (!response.data || !response.data.prices) {
        const errorMessage = 'Invalid response format from CoinGecko API for historical data';
        console.error(errorMessage, 'Response data:', response.data); // Include response data in error log
        this.emit('error', errorMessage, response.data);
        return null;
      }
      return response.data.prices;
    } catch (error: any) {
      console.error('Failed to fetch historical price from CoinGecko API:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`CoinGecko API error for historical data: ${error.response.status} ${error.response.statusText}`, error.response.data);
        return null;
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error(`No response received from CoinGecko API for historical data: ${error.message}`);
        return null;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(`Error setting up CoinGecko API request for historical data: ${error.message}`);
        return null;
      }
    }
  }

  public async getDexLiquidity(): Promise<number> {
    try {
      // TODO: Implement logic to fetch DEX liquidity from a reliable source (e.g., Uniswap V2 pair contract)
      this.logger.warn('DEX liquidity is currently a mock value. Implement the actual logic to fetch DEX liquidity.');
      return 1000000; // Mock liquidity value for now
    } catch (error: any) {
      this.logger.error('Failed to fetch DEX liquidity:', error);
      return 1000000; // Return a default value in case of error
    }
  }
}

// Future improvements:
// 1. Implement authentication handling for APIs that require it.
//    - This could involve adding methods to set and manage API keys or tokens.
//    - Consider using a dedicated API client for handling authentication logic.
// 2. Add more comprehensive error handling and logging throughout the application.
//    - Implement centralized error handling and logging mechanisms.
//    - Provide more context in error messages and logs for easier debugging.
// 3. Implement more robust input validation and data sanitization.
//    - Validate inputs to prevent unexpected issues and security vulnerabilities.
// 4. Add unit and integration tests.
//    - Write tests to cover different parts of the codebase and ensure functionality.

// Example usage:
// const priceFeed = PriceFeed.getInstance();
// priceFeed.on('error', (message, error) => {
//   console.error('PriceFeed Error:', message, error);
// });

// priceFeed.subscribe((data) => {
//   console.log('Price Update:', data);
// });

// priceFeed.getCurrentPrice().then(price => {
//   console.log('Current Price:', price);
// });
