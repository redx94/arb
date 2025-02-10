import type { Trade } from '../../types';

export function calculateProfit(trade: Trade): number {
  if (trade.type === 'SELL\') {
    return trade.price * trade.amount - (trade.gasCost || 0);
  } else {
    return -(trade.price * trade.amount + (trade.gasCost || 0));
  }
}