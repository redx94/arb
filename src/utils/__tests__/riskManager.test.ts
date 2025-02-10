import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManager } from '../riskManager';
import { Trade, Balance, PriceData } from '../../types';

describe('RiskManager', () => {
  let riskManager: RiskManager;
  let mockTrade: Trade;
  let mockBalance: Balance;
  let mockPriceData: PriceData;

  beforeEach(() => {
    riskManager = RiskManager.getInstance();
    riskManager.setMockMode(false);

    mockTrade = {
      id: '1',
      type: 'BUY',
      platform: 'DEX',
      amount: 1n,
      price: 1000n,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    mockBalance = {
      asset: 'ETH',
      dexAmount: 10n,
      cexAmount: 10n,
      wallet: '0x1234567890123456789012345678901234567890',
      pending: 0n
    };

    mockPriceData = {
      dex: 1000,
      cex: 1000,
      timestamp: Date.now()
    };
  });

  it('should validate safe trade', () => {
    expect(() =>
      riskManager.validateTrade(mockTrade, mockBalance, 0.1) // Example risk threshold
    ).not.toThrow();
  });

  it('should detect price manipulation', () => {
    const manipulatedPrice = {
      ...mockPriceData,
      dex: mockPriceData.dex * 1.1 // 10% sudden change
    };

    expect(() =>
      riskManager.validateTrade(mockTrade, mockBalance, 0.1) // Example risk threshold
    ).toThrow('Potential price manipulation detected');
  });

  it('should enforce position size limits', () => {
    const largeTrade = {
      ...mockTrade,
      amount: 100n // Very large position
    };

    expect(() =>
      riskManager.validateTrade(largeTrade, mockBalance, 0.1) // Example risk threshold
    ).toThrow('Trade size exceeds dynamic position limit');
  });

  it('should handle mock mode correctly', () => {
    riskManager.setMockMode(true);
    const largeTrade = {
      ...mockTrade,
      amount: 100n // Would normally be too large
    };

    expect(() =>
      riskManager.validateTrade(largeTrade, mockBalance, 0.1) // Example risk threshold
    ).not.toThrow();
  });
});
