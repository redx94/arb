export class RiskManager {
    constructor() {
        Object.defineProperty(this, "MAX_TRADE_SIZE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process.env.MAX_TRADE_SIZE || '100'
        }); // Maximum trade size in ETH
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
    }
}
