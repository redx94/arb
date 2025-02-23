import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArbitrageEngine } from '../arbitrageEngine';
import { PriceFeed } from '../../priceFeeds';
import { RiskManager } from '../../riskManager';
import type { PriceData } from '../../../types';

describe('ArbitrageEngine', () => {
  let arbitrageEngine: ArbitrageEngine;
  let mockPriceData: PriceData;

  beforeEach(() => {
    arbitrageEngine = ArbitrageEngine.getInstance();
    mockPriceData = {
      dex: 1000,
      cex: 1020, // 2% difference
      timestamp: Date.now()
    };
    arbitrageEngine.stop();
  });

  it('should detect arbitrage opportunities', async () => {
    const opportunities: PriceData[] = [];
    arbitrageEngine.on('opportunity', (data) => {
      opportunities.push(data);
    });
    arbitrageEngine.start();
    PriceFeed.getInstance().emit('price', mockPriceData);
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities[0].dex).toBe(mockPriceData.dex);
    expect(opportunities[0].cex).toBe(mockPriceData.cex);
  });

  it('should not trade when profit is below threshold', async () => {
    const trades: any[] = [];
    arbitrageEngine.on('execution', (data) => {
      trades.push(data);
    });
    const unprofitablePriceData = {
      dex: 1000,
      cex: 1001, // below threshold
      timestamp: Date.now()
    };
    arbitrageEngine.start();
    PriceFeed.getInstance().emit('price', unprofitablePriceData);
    expect(trades.length).toBe(0);
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
    PriceFeed.getInstance().emit('price', mockPriceData);
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
    PriceFeed.getInstance().emit('price', mockPriceData);
    expect(slowExecutions.length).toBeGreaterThan(0);
  });
});
