import { Logger } from '../monitoring.js';
import { CacheManager } from '../cache/cacheManager.js';
import { configManager } from '../config/index.js';
export class GasOptimizer {
    constructor() {
        Object.defineProperty(this, "gasHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "HISTORY_WINDOW", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parseInt(process.env.GAS_HISTORY_WINDOW || '1000')
        });
        Object.defineProperty(this, "MIN_PROFIT_MARGIN", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parseFloat(process.env.GAS_MIN_PROFIT_MARGIN || '0.02')
        });
        Object.defineProperty(this, "MAX_PRIORITY_FEE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: BigInt(process.env.GAS_MAX_PRIORITY_FEE || '3000000000')
        }); // 3 gwei
        Object.defineProperty(this, "BASE_GAS_LIMIT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: BigInt(process.env.GAS_BASE_GAS_LIMIT || '300000')
        });
        this.gasHistory = new CacheManager({ ttl: 3600000 });
        this.startGasMonitoring();
    }
    static getInstance() {
        if (!GasOptimizer.instance) {
            GasOptimizer.instance = new GasOptimizer();
        }
        return GasOptimizer.instance;
    }
    static async estimateGasCost(tx) {
        const provider = configManager.getProvider();
        const estimatedGas = await provider.estimateGas(tx);
        return estimatedGas;
    }
    async startGasMonitoring() {
        try {
            const provider = configManager.getProvider();
            provider.on('block', async (blockNumber) => {
                const feeData = await provider.getFeeData();
                const timestamp = Date.now();
                if (feeData.gasPrice) {
                    this.gasHistory.set(blockNumber.toString(), {
                        timestamp,
                        baseGas: Number(feeData.gasPrice),
                        priorityFee: feeData.maxPriorityFeePerGas != null ? Number(feeData.maxPriorityFeePerGas) : 0,
                        blockNumber: Number(blockNumber)
                    });
                }
            });
        }
        catch (error) {
            Logger.getInstance().error('Failed to start gas monitoring:', error);
        }
    }
    async calculateOptimalGasStrategy(expectedProfit, complexity = 'medium') {
        try {
            const gasStats = await this.analyzeGasHistory();
            const baseGas = this.calculateBaseGas(gasStats);
            const priorityFee = this.calculatePriorityFee(gasStats, expectedProfit);
            const gasLimit = this.calculateGasLimit(complexity);
            const waitBlocks = this.determineWaitBlocks(gasStats);
            const totalGasCost = (baseGas + priorityFee) * gasLimit;
            const minProfit = (expectedProfit * BigInt(Math.floor(this.MIN_PROFIT_MARGIN * 1e6))) / 1000000n;
            if (totalGasCost > minProfit) {
                throw new Error('Gas costs exceed minimum profit threshold');
            }
            return { baseGas, priorityFee, gasLimit, waitBlocks };
        }
        catch (error) {
            Logger.getInstance().error('Failed to calculate optimal gas strategy:', error);
            throw error;
        }
    }
    async analyzeGasHistory() {
        const entries = Array.from(this.gasHistory.getAll());
        if (entries.length === 0)
            return { median: 0, percentile90: 0, trend: 'stable', volatility: 0 };
        const recentHistory = entries
            .slice(-this.HISTORY_WINDOW)
            .map(data => data.baseGas)
            .sort((a, b) => a - b);
        const median = recentHistory[Math.floor(recentHistory.length / 2)] || 0;
        const percentile90 = recentHistory[Math.floor(recentHistory.length * 0.9)] || 0;
        const trend = this.calculateTrend(recentHistory);
        const volatility = this.calculateVolatility(recentHistory);
        return { median, percentile90, trend, volatility };
    }
    calculateTrend(history) {
        if (history.length < 4)
            return 'stable';
        const firstQuarter = history.slice(0, Math.floor(history.length / 4));
        const lastQuarter = history.slice(-Math.floor(history.length / 4));
        const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
        return lastAvg > firstAvg ? 'increasing' : lastAvg < firstAvg ? 'decreasing' : 'stable';
    }
    calculateVolatility(history) {
        if (history.length < 2)
            return 0;
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        return Math.sqrt(history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length);
    }
    calculateBaseGas(gasStats) {
        let baseGas = BigInt(Math.floor(gasStats.median));
        if (gasStats.trend === 'increasing') {
            baseGas += baseGas * 10n / 100n;
        }
        return baseGas + (baseGas * BigInt(Math.ceil(gasStats.volatility * 100)) / 1000n);
    }
    calculatePriorityFee(gasStats, expectedProfit) {
        let priorityFee = BigInt(Math.floor(gasStats.median / 10));
        const profitBasedFee = expectedProfit * 5n / 1000n;
        priorityFee += profitBasedFee;
        return priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee;
    }
    calculateGasLimit(complexity) {
        const multiplier = { low: 1, medium: 2, high: 3 }[complexity];
        return this.BASE_GAS_LIMIT * BigInt(multiplier);
    }
    determineWaitBlocks(gasStats) {
        const trend = gasStats.trend;
        return { decreasing: 1, stable: 2, increasing: 3 }[trend];
    }
}
