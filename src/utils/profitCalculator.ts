import type { Trade } from '../../types';

export function calculateProfit(trade: Trade): number {
  if (trade.type === 'SELL\') {
    return trade.amount * trade.price - (trade.gasCost || 0);
  } else {
    return -(trade.amount * trade.price + (trade.gasCost || 0));
  }
}