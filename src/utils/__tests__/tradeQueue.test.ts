import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TradeQueue } from '../tradeQueue';
import { Trade } from '../../types';

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
      status: 'PENDING'
    };
  });

  it('should add trade to queue', async () => {
    await tradeQueue.addTrade(mockTrade);
    expect(tradeQueue.getQueueLength()).toBe(1);
  });

  it('should process queue in order', async () => {
    const processedTrades: string[] = [];
    tradeQueue.on('tradeExecuted', (result) => {
      processedTrades.push(result.trade.id);
    });
    await Promise.all([
      tradeQueue.addTrade({ ...mockTrade, id: '1' }),
      tradeQueue.addTrade({ ...mockTrade, id: '2' }),
      tradeQueue.addTrade({ ...mockTrade, id: '3' })
    ]);
    expect(processedTrades).toEqual(['1', '2', '3']);
  });

  it('should handle trade failures and retries', async () => {
    const failedTrades: string[] = [];
    tradeQueue.on('tradeFailed', (result) => {
      failedTrades.push(result.trade.id);
    });
    const failingTrade = { ...mockTrade, id: 'fail', amount: -1n };
    await tradeQueue.addTrade(failingTrade);
    expect(failedTrades).toContain('fail');
  });

  it('should clear queue', async () => {
    await tradeQueue.addTrade(mockTrade);
    tradeQueue.clearQueue();
    expect(tradeQueue.getQueueLength()).toBe(0);
  });
});
