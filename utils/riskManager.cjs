import { tradeExecutor } from './tradeExecutor';

export class RiskManager {
    constructor(maxDrawdown, positionLimit, stopLoss, emergencyShutdown) {
        Object.defineProperty(this, "MAX_TRADE_SIZE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.MAX_TRADE_SIZE || '100'
        }); // Maximum trade size in ETH
        this.maxDrawdown = maxDrawdown;
        this.positionLimit = positionLimit;
        this.stopLoss = stopLoss;
        this.emergencyShutdown = emergencyShutdown;
        this.tradeExecutor = tradeExecutor;
    }
    static getInstance() {
        if (!RiskManager.instance) {
            RiskManager.instance = new RiskManager();
        }
        return RiskManager.instance;
    }
    // Updated validation: if price difference exceeds 5%, throw an error.
    validateTrade(data) {
        const diffPercentage = (Math.abs(data.cex - data.dex) / Math.min(data.cex, data.dex)) * 100;
        if (diffPercentage > 5) {
            throw new Error('Risk limit exceeded: Price difference exceeds 5% threshold.');
        }
        if (data.amount > Number(this.MAX_TRADE_SIZE)) {
            throw new Error(`Risk limit exceeded: Trade amount exceeds maximum trade size of ${this.MAX_TRADE_SIZE} ETH.`);
        }

        // Placeholder checks for maxDrawdown, positionLimit, and stopLoss
        const portfolioValue = this.tradeExecutor.getPortfolioValue();
        const initialPortfolioValue = this.tradeExecutor.initialPortfolioValue;
        if (portfolioValue < (1 - this.maxDrawdown / 100) * initialPortfolioValue) {
            throw new Error('Risk limit exceeded: Maximum drawdown reached.');
        }
        if (this.tradeExecutor.positionSize > this.positionLimit) {
            throw new Error('Risk limit exceeded: Position size exceeds limit.');
        }
        if (data.currentPrice < (1 - this.stopLoss / 100) * this.tradeExecutor.entryPrice) {
            throw new Error('Risk limit exceeded: Stop loss triggered.');
        }

        if (this.emergencyShutdown) {
            throw new Error('Emergency shutdown activated.');
        }
    }
}
