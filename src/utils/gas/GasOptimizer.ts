import { ethers } from 'ethers';
import { Logger } from '../monitoring.js';
import { CacheManager } from '../cache/cacheManager.js';
import { configManager } from '../config/index.js';

interface GasHistory {
  timestamp: number;
  baseGas: number;
  priorityFee: number;
  blockNumber: number;
}

interface GasStrategy {
  baseGas: ethers.BigNumberish;
  priorityFee: ethers.BigNumberish;
  gasLimit: ethers.BigNumberish;
  waitBlocks: number;
}

export class GasOptimizer {
  private static instance: GasOptimizer;
  private readonly gasHistory: CacheManager<GasHistory>;
  private readonly HISTORY_WINDOW = parseInt(process.env.GAS_HISTORY_WINDOW || '1000'); // Default: 1000 blocks
  private readonly MIN_PROFIT_MARGIN = parseFloat(process.env.GAS_MIN_PROFIT_MARGIN || '0.02'); // Default: 0.02 (2%)
  private readonly MAX_PRIORITY_FEE = BigInt(process.env.GAS_MAX_PRIORITY_FEE || '3000000000'); // Default: 3 gwei
  private readonly BASE_GAS_LIMIT = BigInt(process.env.GAS_BASE_GAS_LIMIT || '300000'); // Default: 300000

  private constructor() {
    this.gasHistory = new CacheManager<GasHistory>({ ttl: 3600000 });
    this.startGasMonitoring();
  }

  public static getInstance(): GasOptimizer {
    if (!GasOptimizer.instance) {
      GasOptimizer.instance = new GasOptimizer();
    }
    return GasOptimizer.instance;
  }

  static async estimateGasCost(tx: ethers.Transaction): Promise<{ gasLimit: bigint, baseGas: bigint, priorityFee: bigint }> {
    try {
      const provider = configManager.getProvider();
      const estimatedGas = await provider.estimateGas(tx);
      const feeData = await provider.getFeeData();
      const baseGas = feeData.gasPrice ? BigInt(feeData.gasPrice.toString()) : 0n;
      const priorityFee = feeData.maxPriorityFeePerGas ? BigInt(feeData.maxPriorityFeePerGas.toString()) : 0n;
      return { gasLimit: estimatedGas, baseGas, priorityFee };
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      return { gasLimit: 300000n, baseGas: 0n, priorityFee: 0n }; // Provide default values in case of error
    }
  }

  private async startGasMonitoring() {
    try {
      const provider = configManager.getProvider();

      provider.on('block', async (blockNumber: number) => {
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
    } catch (error) {
      Logger.getInstance().error('Failed to start gas monitoring:', error as Error);
    }
  }

  public async calculateOptimalGasStrategy(
    expectedProfit: bigint,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasStrategy> {
    try {
      const gasStats = await this.analyzeGasHistory();
      const baseGas = await this.getQuantumAnnealedGasPrice(gasStats);
      const priorityFee = this.calculatePriorityFee(gasStats, expectedProfit);
      const gasLimit = this.calculateGasLimit(complexity);
      const waitBlocks = this.determineWaitBlocks(gasStats);

      const totalGasCost = (baseGas + priorityFee) * gasLimit;
      const minProfit = (expectedProfit * BigInt(Math.floor(this.MIN_PROFIT_MARGIN * 1e6))) / 1000000n;

      if (totalGasCost > minProfit) {
        throw new Error('Gas costs exceed minimum profit threshold');
      }

      return { baseGas, priorityFee, gasLimit, waitBlocks };
    } catch (error) {
      Logger.getInstance().error('Failed to calculate optimal gas strategy:', error as Error);
      throw error;
    }
  }

  private async getQuantumAnnealedGasPrice(gasStats: any): Promise<bigint> {
    // Simulate quantum annealing for gas price optimization
    console.log("Simulating quantum annealing for gas price...");
    
    // In a real quantum system, this would involve:
    // 1. Encoding the gas price history and network conditions into a qubit Hamiltonian.
    // 2. Running the quantum annealing algorithm to find the minimum energy state,
    //    which corresponds to the optimized gas price.
    // 3. Decoding the optimized gas price from the qubit state.

    // For now, we'll just return a slightly modified base gas price based on volatility.
    let optimizedBaseGas = BigInt(Math.floor(gasStats.median));
    if (gasStats.volatility > 10) { // Example volatility threshold
      optimizedBaseGas = optimizedBaseGas * 95n / 100n; // Reduce gas price by 5% if volatility is high
    } else {
      optimizedBaseGas = optimizedBaseGas * 105n / 100n; // Increase gas price by 5% if volatility is low
    }

    console.log("Quantum annealing simulation complete.");
    return optimizedBaseGas;
  }

  private async analyzeGasHistory() {
    const entries = Array.from(this.gasHistory.getAll());
    if (entries.length === 0) return { median: 0, percentile90: 0, trend: 'stable', volatility: 0 };

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

  private calculateTrend(history: number[]) {
    if (history.length < 4) return 'stable';
    const firstQuarter = history.slice(0, Math.floor(history.length / 4));
    const lastQuarter = history.slice(-Math.floor(history.length / 4));
    const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
    return lastAvg > firstAvg ? 'increasing' : lastAvg < firstAvg ? 'decreasing' : 'stable';
  }

  private calculateVolatility(history: number[]) {
    if (history.length < 2) return 0;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    return Math.sqrt(history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length);
  }

  private calculateBaseGas(gasStats: {
    median: number;
    trend: string;
    volatility: number;
  }): bigint {
    let baseGas = BigInt(Math.floor(gasStats.median));
    if (gasStats.trend === 'increasing') {
      baseGas += baseGas * 10n / 100n;
    }
    return baseGas + (baseGas * BigInt(Math.ceil(gasStats.volatility * 100)) / 1000n);
  }

  private calculatePriorityFee(gasStats: { median: number; percentile90: number; }, expectedProfit: bigint): bigint {
    let priorityFee = BigInt(Math.floor(gasStats.median / 10));
    const profitBasedFee = expectedProfit * 5n / 1000n; // 0.5% of expected profit
    priorityFee += profitBasedFee;

    // Adjust priority fee based on network conditions
    if (gasStats.percentile90 > gasStats.median * 2) {
      // Network is congested, increase priority fee
      priorityFee += BigInt(Math.floor(gasStats.percentile90 / 20)); // Add 5% of percentile90
    }

    return priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee;
  }

  private calculateGasLimit(complexity: 'low' | 'medium' | 'high'): bigint {
    const multiplier = { low: 1, medium: 2, high: 3 }[complexity];
    return this.BASE_GAS_LIMIT * BigInt(multiplier);
  }

  private determineWaitBlocks(gasStats: { trend: string }): number {
    const trend = gasStats.trend as 'increasing' | 'decreasing' | 'stable';
    return { decreasing: 1, stable: 2, increasing: 3 }[trend];
  }
}
