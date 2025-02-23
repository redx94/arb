import { describe, it, expect, beforeEach } from 'vitest';
import { PathFinder } from '../pathFinder';
import type { PriceData } from '../../../types';

describe('PathFinder', () => {
  let pathFinder: PathFinder;
  let mockPriceData: PriceData;

  beforeEach(() => {
    pathFinder = PathFinder.getInstance();
    mockPriceData = {
      dex: 1000,
      cex: 1020,
      timestamp: Date.now()
    };
  });

  it('should find optimal path when profitable opportunity exists', async () => {
    const path = await pathFinder.findOptimalPath('DEX_A', 1.0, mockPriceData);

    expect(path).not.toBeNull();
    expect(path?.expectedProfit).toBeGreaterThan(0);
    expect(path?.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('should return null when no profitable path exists', async () => {
    const unprofitablePriceData = {
      dex: 1000,
      cex: 1001,
      timestamp: Date.now()
    };

    const path = await pathFinder.findOptimalPath('DEX_A', 1.0, unprofitablePriceData);
    expect(path).toBeNull();
  });

  it('should respect maximum path length', async () => {
    const path = await pathFinder.findOptimalPath('DEX_A', 1.0, mockPriceData);
    expect(path?.nodes.length).toBeLessThanOrEqual(3);
  });

  it('should consider fees in profit calculation', async () => {
    const path = await pathFinder.findOptimalPath('DEX_A', 1.0, mockPriceData);
    expect(path?.totalFees).toBeGreaterThan(0);
    expect(path?.expectedProfit).toBeLessThan(mockPriceData.cex - mockPriceData.dex);
  });
});
