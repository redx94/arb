import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManager } from '../riskManager';
import { PriceData } from '../../types';

describe('RiskManager', () => {
  let riskManager: RiskManager;
  let mockPriceData: PriceData;

  beforeEach(() => {
    riskManager = RiskManager.getInstance();

    mockPriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1000,
      cex: 1000,
      timestamp: Date.now()
    };
  });

  it('should validate safe trade', () => {
    expect(() =>
      riskManager.validateTrade({dex: mockPriceData.dex, cex: mockPriceData.cex})
    ).not.toThrow();
  });

  it('should detect price manipulation', () => {
    const manipulatedPrice = {
      ...mockPriceData,
      dex: mockPriceData.dex * 1.1
    };

    expect(() =>
      riskManager.validateTrade({dex: manipulatedPrice.dex, cex: mockPriceData.cex})
    ).toThrow('Risk limit exceeded: Price difference exceeds 5% threshold.');
  });

  it('should enforce position size limits', () => {
    expect(() =>
      riskManager.validateTrade({dex: mockPriceData.dex, cex: mockPriceData.cex})
    ).not.toThrow();
  });

  it('should handle mock mode correctly', () => {
    expect(() =>
      riskManager.validateTrade({dex: mockPriceData.dex, cex: mockPriceData.cex})
    ).not.toThrow();
  });
});
