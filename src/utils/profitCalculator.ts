import type { Trade } from '../types';

export function calculateProfit(trade: Trade): number {
  if (trade.type === 'SELL') {
    return Number(trade.amount * trade.price - (trade.gasCost || 0n));
  } else {
    return Number(-(trade.amount * trade.price + (trade.gasCost || 0n)));
  }
}

export {};
