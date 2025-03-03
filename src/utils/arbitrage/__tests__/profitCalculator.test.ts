import { describe, it, expect, beforeEach } from 'vitest';
import { ProfitCalculator } from '../profitCalculator';

describe('ProfitCalculator', () => {
  let profitCalculator: ProfitCalculator;
  let mockPriceData: { dex: number; cex: number; timestamp: number; token: string; price: number };

  beforeEach(() => {
    profitCalculator = ProfitCalculator.getInstance();
    mockPriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1000,
      cex: 1020,
      timestamp: Date.now()
    };
  });

  it('should calculate potential profit correctly', async () => {
    const buyPrice = 1000;
    const sellPrice = 1020;
    const amount = 1;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, mockPriceData);
    expect(result.profit).toBeGreaterThan(0);
  });

  it('should return isViable as false when profit is below threshold', async () => {
    const buyPrice = 1000;
    const sellPrice = 1000.5;
    const amount = 1;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, mockPriceData);
    expect(result.isViable).toBe(false);
  });

  it('should handle zero values correctly', async () => {
    const zeroPriceData = {
      token: 'ETH',
      price: 0,
      dex: 0,
      cex: 0,
      timestamp: Date.now()
    };
    const buyPrice = 0;
    const sellPrice = 0;
    const amount = 1;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, zeroPriceData);
    expect(result.profit).toBe(0);
  });

  it('should handle unprofitable scenarios', async () => {
    const unprofitablePriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1020,
      cex: 1000,
      timestamp: Date.now()
    };
    const buyPrice = 1020;
    const sellPrice = 1000;
    const amount = 1;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, unprofitablePriceData);
    expect(result.profit).toBeLessThan(0);
  });

  it('should handle large numbers correctly', async () => {
    const largePriceData = {
      token: 'ETH',
      price: 100000,
      dex: 50000,
      cex: 50500,
      timestamp: Date.now()
    };
    const buyPrice = 50000;
    const sellPrice = 50500;
    const amount = 10;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, largePriceData);
    expect(result.profit).toBeGreaterThan(0);
  });

  it('should handle different amounts correctly', async () => {
    const mockPriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1000,
      cex: 1020,
      timestamp: Date.now()
    };
    const buyPrice = 1000;
    const sellPrice = 1020;
    const amount = 0.5;
    const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, mockPriceData);
    expect(result.profit).toBeGreaterThan(0);
  });
});
