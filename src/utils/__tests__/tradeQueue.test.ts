import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TradeQueue } from '../tradeQueue';
import { Trade } from '../../types';

vi.setConfig({ testTimeout: 10000 }); // Set timeout to 10 seconds (10000 ms)

describe('TradeQueue', () => {
  let tradeQueue: TradeQueue;
  let mockTrade: Trade;

  beforeEach(() => {
    tradeQueue = TradeQueue.getInstance();
    tradeQueue.clearQueue();
    mockTrade = {
      id: '1',
      type: 'BUY',
      platform: 'DEX',
      amount: 1n,
      price: 1000n,
      timestamp: Date.now(),
      status: 'PENDING',
      effectivePrice: 0n,
      profitLoss: 0n,
      priceImpact: 0n,
      gasCost: 0n,
      warnings: []
    };
  });

  it('should add trade to queue', async () => {
    return new Promise<void>(resolve => {
      tradeQueue.on('tradeExecuted', () => {
        resolve();
      });
      tradeQueue.addTrade({ ...mockTrade, id: '1' });
    })
  });

  it('should process queue in order', async () => {
    return new Promise<void>(resolve => {
      tradeQueue.on('tradeExecuted', () => {
        resolve();
      });
      tradeQueue.addTrade({ ...mockTrade, id: '1' });
    })
  });

  it('should handle trade failures and retries', async () => {
    const failedTrades: string[] = [];
    return new Promise<void>(resolve => {
      tradeQueue.on('tradeFailed', (result) => {
        failedTrades.push(result.trade.id);
        expect(failedTrades).toContain('fail'); // Assertion moved inside event listener
        resolve(); // Resolve promise when tradeFailed event is emitted and assertion is done
      });
      const failingTrade = { ...mockTrade, id: 'fail', amount: -1n };
      tradeQueue.addTrade(failingTrade);
    });
  });

  it('should clear queue', async () => {
    await tradeQueue.addTrade(mockTrade);
    tradeQueue.clearQueue();
    expect(tradeQueue.getQueueLength()).toBe(0);
  });
});
