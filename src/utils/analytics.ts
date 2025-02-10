import { Trade, PriceData } from '../types';

export class PerformanceAnalytics {
  private trades: Trade[] = [];
  private readonly TRADE_HISTORY_LIMIT = 1000;

  public addTrade(trade: Trade) {
    this.trades.push(trade);
    if (this.trades.length > this.TRADE_HISTORY_LIMIT) {
      this.trades.shift();
    }
  }

  public getPerformanceMetrics() {
    const profitableTrades = this.trades.filter(t => this.calculateProfitLoss(t) > 0);
    return {
      winRate: profitableTrades.length / this.trades.length,
      averageReturn: this.calculateAverageReturn(),
      sharpeRatio: this.calculateSharpeRatio(),
      maxDrawdown: this.calculateMaxDrawdown(),
      totalTrades: this.trades.length
    };
  }

  private calculateProfitLoss(trade: Trade): bigint {
    return trade.type === 'SELL'
      ? BigInt(trade.amount) * BigInt(trade.price) - BigInt(trade.gasCost || 0)
      : -(BigInt(trade.amount) * BigInt(trade.price) + BigInt(trade.gasCost || 0));
  }

  private calculateAverageReturn(): bigint {
    const returns = this.trades.map(t => this.calculateProfitLoss(t));
    return returns.reduce((a, b) => a + b, 0n) / BigInt(returns.length);
  }

  private calculateSharpeRatio(): number {
    const returns = this.trades.map(t => Number(this.calculateProfitLoss(t)));
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
    );
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  private calculateMaxDrawdown(): number {
    let peak = -Infinity;
    let maxDrawdown = 0;
    let runningTotal = 0;
    for (const trade of this.trades) {
      runningTotal += Number(this.calculateProfitLoss(trade));
      peak = Math.max(peak, runningTotal);
      maxDrawdown = Math.max(maxDrawdown, peak - runningTotal);
    }
    return maxDrawdown;
  }
}
