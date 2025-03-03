import type { Balance, TradeDetails } from '../types';
import { PriceFeed } from './priceFeeds';

class TradeExecutor {
  // Placeholder balances - these should be replaced with actual account balances
  private balances: Balance[] = [
    { asset: 'ETH', dexAmount: 10, cexAmount: 10, pending: 0 },
  ];

  public getBalances(): Balance[] {
    return this.balances;
  }

  public async executeTrade(
    type: 'BUY' | 'SELL',
    platform: string,
    amount: string,
    price: number
  ): Promise<{ success: boolean; trade?: TradeDetails; error?: string }> {
    try {
      const amountNumber = Number(amount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Invalid trade amount');
      }

      const balance = this.balances.find(b => b.asset === 'ETH');
      if (!balance) {
        throw new Error('ETH balance not found');
      }

      if (type === 'BUY') {
        if (platform === 'DEX') {
          if (balance.dexAmount < amountNumber) {
            throw new Error('Insufficient DEX balance');
          }
          balance.dexAmount -= amountNumber;
          balance.pending += amountNumber;
        } else {
          if (balance.cexAmount < amountNumber) {
            throw new Error('Insufficient CEX balance');
          }
          balance.cexAmount -= amountNumber;
          balance.pending += amountNumber;
        }
      } else {
        if (platform === 'DEX') {
          balance.dexAmount += amountNumber;
          balance.pending -= amountNumber;
        } else {
          balance.cexAmount += amountNumber;
          balance.pending -= amountNumber;
        }
      }

      const tradeDetails: TradeDetails = {
        id: Math.random().toString(36).substring(2, 15),
        type,
        platform,
        amount: amountNumber,
        price,
        effectivePrice: price,
        profitLoss: 0,
        priceImpact: 0,
        gasCost: 0,
        timestamp: Date.now(),
        status: 'COMPLETED',
        warnings: [],
        executedPrice: 0,
        slippage: 0,
        feeStructure: {
          makerFee: 0,
          takerFee: 0
        }
      };

      return { success: true, trade: tradeDetails };
    } catch (error: any) {
      console.error('Trade execution failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async calculateProfit(trade: TradeDetails): Promise<number> {
    // Basic profit calculation: (sell price - buy price) * amount
    return (trade.type === 'SELL' ? 1 : -1) * trade.amount * (trade.effectivePrice - trade.price);
  }

  async calculatePriceImpact(trade: TradeDetails): Promise<number> {
    // Estimate price impact based on trade size and current price
    const priceFeed = PriceFeed.getInstance();
    const currentPriceData = await priceFeed.getCurrentPrice();
    const currentPrice = currentPriceData.price || 1000; // Use a default price if price is not available
    const priceChange = trade.amount / currentPrice;
    return priceChange;
  }
}

export const tradeExecutor = new TradeExecutor();
