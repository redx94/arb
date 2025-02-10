import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import { ProfitCalculator } from '../profitCalculator';
import type { PriceData } from '../../../types';

describe('ProfitCalculator', () => {
  let profitCalculator: ProfitCalculator;
  let mockPriceData: PriceData;

  beforeEach(() => {
    profitCalculator = ProfitCalculator.getInstance();
    mockPriceData = {
      dex: 1000,
      cex: 1020,
      timestamp: Date.now()
    };
  });

  it('should calculate profit correctly', async () => {
    const result = await profitCalculator.calculatePotentialProfit(
      1000,
      1020,
      1.0,
      mockPriceData
    );

    expect(result.isViable).toBe(true);
    expect(result.profit > 0).toBe(true);
  });

  it('should include all costs in calculation', async () => {
    const result = await profitCalculator.calculatePotentialProfit(
      1000,
      1020,
      1.0,
      mockPriceData
    );

    expect(result.details.breakdown.flashLoanCost > 0).toBe(true);
    expect(result.details.breakdown.gasCost > 0).toBe(true);
    expect(result.details.breakdown.slippageCost > 0).toBe(true);
  });

  it('should reject unprofitable trades', async () => {
    const result = await profitCalculator.calculatePotentialProfit(
      1000,
      1001, // Very small price difference
      1.0,
      mockPriceData
    );

    expect(result.isViable).toBe(false);
  });

  it('should handle large numbers correctly', async () => {
    const result = await profitCalculator.calculatePotentialProfit(
      1000,
      1020,
      100.0, // Large amount
      mockPriceData
    );

    expect(() => result.profit.toString()).not.toThrow();
    expect(result.details.grossProfit > 0).toBe(true);
  });
});
