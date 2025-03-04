import { describe, it, expect } from 'vitest';
import { validateTrade } from '../validation';

describe('Trade Validation', () => {
  it('should validate a trade with correct types', () => {
    const trade = {
      id: '1',
      type: 'BUY' as const,
      platform: 'DEX' as const,
      amount: 1000n, // bigint
      price: 1000n, // bigint
      timestamp: Date.now(),
      status: 'PENDING' as const,
      effectivePrice: 0n,
      profitLoss: 0n,
      priceImpact: 0n,
      gasCost: 0n,
      warnings: [] as never[],
    };

    expect(validateTrade(trade)).toBe(true);
  });

  it('should invalidate a trade with incorrect types', () => {
    const trade = {
      id: '1',
      type: 'BUY' as const,
      platform: 'DEX' as const,
    amount: '1000' as any, // Incorrect type: string instead of bigint
    price: 1000n,
    timestamp: Date.now(),
    status: 'PENDING' as const,
    effectivePrice: 0n,
    profitLoss: 0n,
    priceImpact: 0n,
    gasCost: 0n,
    warnings: [] as never[],
  };

  expect(validateTrade(trade)).toBe(false);
});
});
