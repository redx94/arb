import { Trade } from '../types';

export function validateTrade(trade: Trade): boolean {
  // Implement validation logic
  return typeof trade.amount === 'bigint' && typeof trade.price === 'bigint';
}
