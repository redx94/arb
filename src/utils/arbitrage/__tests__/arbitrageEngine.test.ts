import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArbitrageEngine } from '../arbitrageEngine';
import { PriceFeed } from '../../priceFeeds';
import { RiskManager } from '../../riskManager';

describe('ArbitrageEngine', () => {
  let arbitrageEngine: ArbitrageEngine;
  let mockPriceData: { dex: number; cex: number; timestamp: number; token: string; price: number };

  beforeEach(() => {
    arbitrageEngine = ArbitrageEngine.getInstance();
    mockPriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1000,
      cex: 1000,
      timestamp: Date.now()
    };
  });

  it('should start and stop correctly', () => {
    arbitrageEngine.start();
    expect(arbitrageEngine.isRunning()).toBe(true);
    arbitrageEngine.stop();
    expect(arbitrageEngine.isRunning()).toBe(false);
  });

  it('should detect profitable arbitrage opportunity', (done: any) => {
    const profitablePriceData = {
      token: 'ETH',
      price: 1000,
      dex: 990,
      cex: 1010,
      timestamp: Date.now()
    };
    arbitrageEngine.start();
    arbitrageEngine.on('opportunity', (data: any) => {
      expect(data).toEqual(profitablePriceData);
      done();
    });
    PriceFeed.getInstance().updatePrice(profitablePriceData);
  });

  it('should not detect unprofitable arbitrage opportunity', () => {
    const unprofitablePriceData = {
      token: 'ETH',
      price: 1000,
      dex: 1010,
      cex: 990,
      timestamp: Date.now()
    };
    let opportunityEmitted = false;
    arbitrageEngine.on('opportunity', () => {
      opportunityEmitted = true;
    });
    PriceFeed.getInstance().updatePrice(unprofitablePriceData);
    expect(opportunityEmitted).toBe(false);
  });

  it('should respect risk management rules', async () => {
    const warnings: any[] = [];
    arbitrageEngine.on('warning', (data) => {
      warnings.push(data);
    });
    vi.spyOn(RiskManager.getInstance(), 'validateTrade').mockImplementation(() => {
      throw new Error('Risk limit exceeded');
    });
    arbitrageEngine.start();
    PriceFeed.getInstance().updatePrice(mockPriceData);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Risk limit exceeded');
  });

  it('should handle execution time limits', async () => {
    const slowExecutions: any[] = [];
    arbitrageEngine.on('warning', (data) => {
      if (data.includes('execution time')) {
        slowExecutions.push(data);
      }
    });
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0 as any;
    });
    arbitrageEngine.start();
    PriceFeed.getInstance().updatePrice(mockPriceData);
    expect(slowExecutions.length).toBeGreaterThan(0);
  });
});
