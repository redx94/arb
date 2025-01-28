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
      amount: 1,
      price: 1000,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    mockBalance = {
      asset: 'ETH',
      dexAmount: 10,
      cexAmount: 10,
      wallet: '0x1234567890123456789012345678901234567890',
      pending: 0
    };

    mockPriceData = {
      dex: 1000,
      cex: 1000,
      timestamp: Date.now()
    };
  });

  it('should validate safe trade', () => {
    expect(() => 
      riskManager.validateTrade(mockTrade, mockBalance, mockPriceData)
    ).not.toThrow();
  });

  it('should detect price manipulation', () => {
    const manipulatedPrice = {
      ...mockPriceData,
      dex: mockPriceData.dex * 1.1 // 10% sudden change
    };

    expect(() => 
      riskManager.validateTrade(mockTrade, mockBalance, manipulatedPrice)
    ).toThrow('Potential price manipulation detected');
  });

  it('should enforce position size limits', () => {
    const largeTrade = {
      ...mockTrade,
      amount: 100 // Very large position
    };

    expect(() => 
      riskManager.validateTrade(largeTrade, mockBalance, mockPriceData)
    ).toThrow('Trade size exceeds dynamic position limit');
  });

  it('should handle mock mode correctly', () => {
    riskManager.setMockMode(true);
    const largeTrade = {
      ...mockTrade,
      amount: 100 // Would normally be too large
    };

    expect(() => 
      riskManager.validateTrade(largeTrade, mockBalance, mockPriceData)
    ).not.toThrow();
  });
});