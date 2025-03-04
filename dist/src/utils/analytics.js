export class PerformanceAnalytics {
    constructor() {
        Object.defineProperty(this, "trades", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "TRADE_HISTORY_LIMIT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    addTrade(trade) {
        this.trades.push(trade);
        if (this.trades.length > this.TRADE_HISTORY_LIMIT) {
            this.trades.shift();
        }
    }
    getPerformanceMetrics() {
        const profitableTrades = this.trades.filter(t => this.calculateProfitLoss(t) > 0);
        return {
            winRate: profitableTrades.length / this.trades.length,
            averageReturn: this.calculateAverageReturn(),
            sharpeRatio: this.calculateSharpeRatio(),
            maxDrawdown: this.calculateMaxDrawdown(),
            totalTrades: this.trades.length
        };
    }
    calculateProfitLoss(trade) {
        return trade.type === 'SELL'
            ? BigInt(trade.amount) * BigInt(trade.price) - BigInt(trade.gasCost || 0)
            : -(BigInt(trade.amount) * BigInt(trade.price) + BigInt(trade.gasCost || 0));
    }
    calculateAverageReturn() {
        const returns = this.trades.map(t => this.calculateProfitLoss(t));
        return returns.reduce((a, b) => a + b, 0n) / BigInt(returns.length);
    }
    calculateSharpeRatio() {
        const returns = this.trades.map(t => Number(this.calculateProfitLoss(t)));
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
        return stdDev === 0 ? 0 : avgReturn / stdDev;
    }
    calculateMaxDrawdown() {
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
