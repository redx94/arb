import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { PriceData } from '../types';
import { generateMockPrices } from './mockData';
import { configManager } from './config';
import { Logger } from './monitoring';
import { ErrorHandler } from './errors/ErrorHandler';

const logger = Logger.getInstance();
const errorHandler = ErrorHandler.getInstance();

// Default mock prices to ensure we always have a fallback
const DEFAULT_MOCK_PRICES: PriceData = {
  dex: 3000,
  cex: 3000,
  timestamp: Date.now()
};

export class PriceFeed {
  private static instance: PriceFeed;
  private readonly eventEmitter = new EventEmitter();
  private useMockData: boolean = true;
  private updateInterval: number = 10000;
  private listeners: Set<(data: PriceData) => void> = new Set();
  private lastValidPrice: PriceData = DEFAULT_MOCK_PRICES;
  private updateTimer: NodeJS.Timer | null = null;
  private isInitialized: boolean = false;
  private readonly VALIDATION_TIMEOUT = 5000;
  private readonly MAX_PRICE_DIFFERENCE = 0.1; // 10%
  private readonly MIN_PRICE = 100;
  private readonly MAX_PRICE = 10000;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PriceFeed {
    if (!PriceFeed.instance) {
      PriceFeed.instance = new PriceFeed();
    }
    return PriceFeed.instance;
  }

  private async initialize() {
    try {
      // Start with default mock prices
      this.lastValidPrice = { ...DEFAULT_MOCK_PRICES, timestamp: Date.now() };
      await this.startFeed();
      this.isInitialized = true;
    } catch (error) {
      logger.error('Price feed initialization failed:', error);
      // Even if initialization fails, we can continue with mock data
      await this.startFeed();
    }
  }

  public subscribe(callback: (data: PriceData) => void): () => void {
    this.listeners.add(callback);
    // Immediately send current price to new subscriber
    callback(this.lastValidPrice);
    
    return () => {
      this.unsubscribe(callback);
    };
  }

  public unsubscribe(callback: (data: PriceData) => void): void {
    this.listeners.delete(callback);
  }

  private async validatePriceData(priceData: PriceData): Promise<boolean> {
    try {
      if (!priceData) return false;

      // Network check
      if (!navigator.onLine) {
        throw new Error('Network connection lost');
      }

      const validation = Promise.race([
        this.performValidation(priceData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Price validation timeout')), this.VALIDATION_TIMEOUT)
        )
      ]);

      return await validation;
    } catch (error) {
      logger.error('Price validation failed:', error);
      return false;
    }
  }

  private async performValidation(priceData: PriceData): Promise<boolean> {
    // Ensure prices are positive and within reasonable range
    if (priceData.dex <= this.MIN_PRICE || priceData.dex > this.MAX_PRICE ||
        priceData.cex <= this.MIN_PRICE || priceData.cex > this.MAX_PRICE) {
      logger.warn('Price out of valid range:', priceData);
      return false;
    }

    // Validate timestamp
    if (priceData.timestamp <= 0 || priceData.timestamp > Date.now()) {
      logger.warn('Invalid timestamp:', priceData.timestamp);
      return false;
    }

    // Check for reasonable price difference
    const priceDiff = Math.abs(priceData.dex - priceData.cex) / Math.min(priceData.dex, priceData.cex);
    if (priceDiff > this.MAX_PRICE_DIFFERENCE) {
      logger.warn('Suspicious price difference detected:', priceDiff);
      return false;
    }

    return true;
  }

  private async updatePrices() {
    try {
      let priceData: PriceData;

      if (this.useMockData) {
        priceData = generateMockPrices();
      } else {
        // Always use mock data for now since we're in development
        priceData = generateMockPrices();
      }

      const isValid = await errorHandler.withRetry(
        () => this.validatePriceData(priceData),
        'Price validation'
      );

      if (isValid) {
        this.lastValidPrice = priceData;
        this.notifyListeners(priceData);
      } else {
        // If validation fails, use last valid price with updated timestamp
        const fallbackPrice = {
          ...this.lastValidPrice,
          timestamp: Date.now()
        };
        this.notifyListeners(fallbackPrice);
      }
    } catch (error) {
      logger.error('Price update failed:', error);
      // Use last valid price with updated timestamp
      const fallbackPrice = {
        ...this.lastValidPrice,
        timestamp: Date.now()
      };
      this.notifyListeners(fallbackPrice);
    }
  }

  private notifyListeners(priceData: PriceData) {
    for (const listener of this.listeners) {
      try {
        listener(priceData);
      } catch (error) {
        logger.error('Error in price feed listener:', error);
      }
    }
  }

  private async startFeed() {
    // Initial update
    await this.updatePrices();

    // Regular updates
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(
      () => this.updatePrices(),
      this.updateInterval
    );
  }

  public setMockMode(useMock: boolean) {
    this.useMockData = useMock;
    // Restart feed with new mode
    this.startFeed();
  }

  public getCurrentPrice(): PriceData {
    return this.lastValidPrice;
  }

  public cleanup(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.listeners.clear();
  }
}