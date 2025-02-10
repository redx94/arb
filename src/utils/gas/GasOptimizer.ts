import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { Logger } from '../monitoring';
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
  private readonly HISTORY_WINDOW = 1000; // Number of blocks to analyze
  private readonly MIN_PROFIT_MARGIN = 0.02; // 2% minimum profit after gas
  private readonly MAX_PRIORITY_FEE = ethers.parseUnits('3', 'gwei');
  private readonly BASE_GAS_LIMIT = ethers.BigNumber.from('300000');

  private constructor() {
    this.gasHistory = new CacheManager<GasHistory>({ ttl: 3600000 }); // 1 hour TTL
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

      // Validate that gas costs don't eat too much into profits
      const totalGasCost = ethers.BigNumber.from(baseGas).add(priorityFee).mul(gasLimit);
      const minProfit = ethers.BigNumber.from(expectedProfit).mul(ethers.parseUnits(this.MIN_PROFIT_MARGIN.toString(), 'ether'));

      if (totalGasCost.gt(minProfit)) {
        throw new Error('Gas costs exceed minimum profit threshold');
      }

      return {
        baseGas,
        priorityFee,
        gasLimit,
        waitBlocks
      };
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
    const recentHistory = Array.from(this.gasHistory)
      .slice(-this.HISTORY_WINDOW)
      .map(([_, data]) => data.baseGas)
      .sort((a, b) => a - b);

    const median = recentHistory[Math.floor(recentHistory.length / 2)];
    const percentile90 = recentHistory[Math.floor(recentHistory.length * 0.9)];

    // Calculate trend
    const trend = this.calculateTrend(recentHistory);

    // Calculate volatility
    const mean = recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length;
const volatility = Math.sqrt(
  recentHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentHistory.length
);

    return { median, percentile90, trend, volatility };
  }

  private calculateTrend(history: number[]): 'increasing' | 'decreasing' | 'stable' {
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondMean - firstMean;
    const threshold = firstMean * 0.05; // 5% threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  private calculateBaseGas(gasStats: {
    median: number;
    percentile90: number;
    trend: string;
    volatility: number;
  }): ethers.BigNumberish {
    let baseGas = ethers.BigNumber.from(gasStats.median);

    // Adjust based on trend and volatility
    if (gasStats.trend === 'increasing') {
      baseGas = baseGas.add(baseGas.mul(10).div(100)); // Add 10%
    }

    // Add volatility buffer
    const volatilityBuffer = baseGas.mul(Math.ceil(gasStats.volatility * 100)).div(1000);
    baseGas = baseGas.add(volatilityBuffer);

    return baseGas;
  }

  private calculatePriorityFee(
    gasStats: { median: number; percentile90: number; trend: string; volatility: number },
    expectedProfit: ethers.BigNumberish
  ): ethers.BigNumberish {
    // Start with 10% of base fee as priority fee
    let priorityFee = ethers.BigNumber.from(gasStats.median).div(10);

    // Adjust based on expected profit
    const profitBasedFee = ethers.BigNumber.from(expectedProfit).mul(5).div(1000); // 0.5% of profit
    priorityFee = priorityFee.add(profitBasedFee).min(this.MAX_PRIORITY_FEE);

    return priorityFee;
  }

  private calculateGasLimit(complexity: 'low' | 'medium' | 'high'): ethers.BigNumberish {
const multiplier = {
  low: ethers.BigNumber.from(1),
  medium: ethers.BigNumber.from(2),
  high: ethers.BigNumber.from(3)
}[complexity];

    return ethers.BigNumber.from(this.BASE_GAS_LIMIT).mul(multiplier);
  }

  private determineWaitBlocks(gasStats: {
    median: number;
    percentile90: number;
    trend: string;
    volatility: number;
  }): number {
    if (gasStats.trend === 'decreasing') return 1; // Execute quickly if gas is trending down
    if (gasStats.trend === 'increasing') return 3; // Wait longer if gas is trending up
    return 2; // Default wait time
  }

  public async estimateFlashLoanGas(
    tokenAddress: string,
    amount: ethers.BigNumberish,
    steps: number
  ): Promise<ethers.BigNumberish> {
    // Base cost for flash loan
    let estimate = ethers.BigNumber.from(this.BASE_GAS_LIMIT);

    // Add gas for each step in the arbitrage
    estimate = estimate.add(ethers.BigNumber.from(100000).mul(steps));

    // Add overhead for token transfers
    estimate = estimate.add(ethers.BigNumber.from(50000));

    return estimate;
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }
}
