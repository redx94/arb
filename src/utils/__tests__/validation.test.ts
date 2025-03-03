import { describe, it, expect } from 'vitest';
import { validateTrade } from '../validation';

describe('Trade Validation', () => {
  it('should validate a trade with correct types', () => {
    const trade = {
      id: '1',
      type: 'BUY' as const,
      platform: 'DEX' as const,
      amount: 1000,
      price: 1000,
      timestamp: Date.now(),
      status: 'PENDING' as const,
      effectivePrice: 0,
      profitLoss: 0,
      priceImpact: 0,
      gasCost: 0,
      warnings: []
    };

    expect(validateTrade(trade)).toBe(true);
  });

  it('should invalidate a trade with incorrect types', () => {
    const trade = {
      id: '1',
      type: 'BUY' as const,
      platform: 'DEX' as const,
      amount: 1000,
      price: 1000,
      timestamp: Date.now(),
      status: 'PENDING' as const,
      effectivePrice: 0,
      profitLoss: 0,
      priceImpact: 0,
      gasCost: 0,
      warnings: []
    };

    expect(validateTrade(trade)).toBe(false);
  });
});
