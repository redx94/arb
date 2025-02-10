import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { Logger } from '../monitoring/index';
import { CacheManager } from '../cache/cacheManager';

const logger = Logger.getInstance();

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
  private readonly eventEmitter = new EventEmitter();
  private readonly gasHistory: CacheManager<GasHistory>;
  private readonly HISTORY_WINDOW = 1000;
  private readonly MIN_PROFIT_MARGIN = 0.02;
  private readonly MAX_PRIORITY_FEE = ethers.parseUnits('3', 'gwei');
  private readonly BASE_GAS_LIMIT = ethers.toBigInt(300000);

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

  private async startGasMonitoring() {
    try {
      const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);

      provider.on('block', async (blockNumber) => {
        const feeData = await provider.getFeeData();
        const timestamp = Date.now();

        if (feeData.gasPrice) {
          this.gasHistory.set(blockNumber.toString(), {
            timestamp,
            baseGas: Number(feeData.gasPrice),
            priorityFee: Number(feeData.maxPriorityFeePerGas || 0),
            blockNumber: Number(blockNumber)
          });
        }
      });
    } catch (error) {
      logger.error('Failed to start gas monitoring:', error as Error);
    }
  }

  public async calculateOptimalGasStrategy(
    expectedProfit: ethers.BigNumberish,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasStrategy> {
    try {
      const gasStats = await this.analyzeGasHistory();
      const baseGas = this.calculateBaseGas(gasStats);
      const priorityFee = this.calculatePriorityFee(gasStats, expectedProfit);
      const gasLimit = this.calculateGasLimit(complexity);
      const waitBlocks = this.determineWaitBlocks(gasStats);

      const totalGasCost = (ethers.toBigInt(baseGas) + ethers.toBigInt(priorityFee)) * ethers.toBigInt(gasLimit);
      const minProfit = ethers.toBigInt(expectedProfit) * ethers.toBigInt(Math.floor(this.MIN_PROFIT_MARGIN * 1e18)) / ethers.toBigInt(1e18);

      if (totalGasCost > minProfit) {
        throw new Error('Gas costs exceed minimum profit threshold');
      }

      return { baseGas, priorityFee, gasLimit, waitBlocks };
    } catch (error) {
      logger.error('Failed to calculate optimal gas strategy:', error as Error);
      throw error;
    }
  }

  private async analyzeGasHistory(): Promise<{
    median: number;
    percentile90: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  }> {
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

  private calculateTrend(history: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 4) return 'stable';
    const firstQuarter = history.slice(0, Math.floor(history.length / 4));
    const lastQuarter = history.slice(-Math.floor(history.length / 4));
    const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
    return lastAvg > firstAvg ? 'increasing' : lastAvg < firstAvg ? 'decreasing' : 'stable';
  }

  private calculateVolatility(history: number[]): number {
    if (history.length < 2) return 0;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    return Math.sqrt(history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length);
  }

  private calculateBaseGas(gasStats: {
    median: number;
    percentile90: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  }): ethers.BigNumberish {
    let baseGas = ethers.toBigInt(Math.floor(gasStats.median));

    if (gasStats.trend === 'increasing') {
      baseGas += baseGas * ethers.toBigInt(10) / ethers.toBigInt(100);
    }

    const volatilityBuffer = baseGas * ethers.toBigInt(Math.ceil(gasStats.volatility * 100)) / ethers.toBigInt(1000);
    return baseGas + volatilityBuffer;
  }

  private calculatePriorityFee(
    gasStats: { median: number; percentile90: number; trend: string; volatility: number },
    expectedProfit: ethers.BigNumberish
  ): ethers.BigNumberish {
    let priorityFee = ethers.toBigInt(Math.floor(gasStats.median / 10));
    const profitBasedFee = ethers.toBigInt(expectedProfit) * ethers.toBigInt(5) / ethers.toBigInt(1000);
    priorityFee += profitBasedFee;
    return priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee;
  }

  private calculateGasLimit(complexity: 'low' | 'medium' | 'high'): ethers.BigNumberish {
    const multiplier = { low: 1, medium: 2, high: 3 }[complexity];
    return this.BASE_GAS_LIMIT * ethers.toBigInt(multiplier);
  }

  private determineWaitBlocks(gasStats: {
    trend: 'increasing' | 'decreasing' | 'stable';
  }): number {
    return { decreasing: 1, stable: 2, increasing: 3 }[gasStats.trend];
  }

  public async estimateFlashLoanGas(
    tokenAddress: string,
    amount: ethers.BigNumberish,
    steps: number
  ): Promise<ethers.BigNumberish> {
    let estimate = this.BASE_GAS_LIMIT;
    estimate += ethers.toBigInt(100000) * ethers.toBigInt(steps);
    estimate += ethers.toBigInt(50000);
    return estimate;
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
}
