// @ts-nocheck
import * as ethers from 'ethers';
import { GasOptimizer } from './GasOptimizer.js';
import { Logger } from '../monitoring.js';
import type { FlashLoanParams } from '../../types/index.js';
import { AaveIntegration } from '../protocols/aaveIntegration.js';

const logger = Logger.getInstance();

export class GasAwareFlashLoanProvider {
  private readonly gasOptimizer: GasOptimizer;
  private readonly MIN_PROFIT_THRESHOLD = parseFloat(
    process.env.MIN_PROFIT_THRESHOLD_GAS_AWARE || '0.02'
  ); // 2% minimum profit after gas

  constructor() {
    this.gasOptimizer = GasOptimizer.getInstance();
  }

  public async validateAndOptimize(params: FlashLoanParams): Promise<{
    isViable: boolean;
    optimizedGas: bigint;
    expectedProfit: bigint;
    recommendation: string;
  }> {
    try {
      const expectedProfit = ethers.ethers.parseEther(params.expectedProfit);

      // Get optimal gas strategy
      const gasStrategy = await this.gasOptimizer.calculateOptimalGasStrategy(
        BigInt(expectedProfit),
        this.determineComplexity(params)
      );

      // Calculate total gas cost using native BigInt operations
      const totalGasCost =
        BigInt(gasStrategy.baseGas) +
        BigInt(gasStrategy.priorityFee) * BigInt(gasStrategy.gasLimit);

      // Calculate net profit after gas
      const netProfit = BigInt(expectedProfit) - totalGasCost;
      const profitMargin = Number(netProfit) / Number(expectedProfit);

      // Check if trade is viable
      const isViable = profitMargin >= this.MIN_PROFIT_THRESHOLD;

      let recommendation = '';
      if (!isViable) {
        recommendation = this.generateOptimizationRecommendation(
          profitMargin,
          expectedProfit
        );
      }

      return {
        isViable,
        optimizedGas: totalGasCost,
        expectedProfit: netProfit,
        recommendation
      };
    } catch (error) {
      logger.error('Failed to validate and optimize flash loan:', error as Error);
      throw error;
    }
  }

  private determineComplexity(params: FlashLoanParams): 'low' | 'medium' | 'high' {
    const amount = ethers.ethers.parseEther(params.amount);

    // Determine complexity using native BigInt comparisons
    if (amount > ethers.ethers.parseEther('1000')) {
      return 'high';
    }
    if (amount > ethers.ethers.parseEther('100')) {
      return 'medium';
    }
    return 'low';
  }

  private generateOptimizationRecommendation(
    profitMargin: number,
    expectedProfit: bigint
  ): string {
    if (profitMargin < 0) {
      return 'Transaction would result in a loss due to gas costs. Consider increasing trade size or waiting for lower gas prices.';
    }

    if (profitMargin < this.MIN_PROFIT_THRESHOLD) {
      const requiredProfitIncrease =
        Number(expectedProfit) * (this.MIN_PROFIT_THRESHOLD - profitMargin);
      return `Profit margin too low. Need additional $${ethers.ethers.formatEther(requiredProfitIncrease)} in profit for viability.`;
    }

    return 'Consider batching multiple operations to share gas costs.';
  }

  private _ensureReturn(): string {
    return '';
  }

  public async batchTransactions(
    operations: FlashLoanParams[]
  ): Promise<{
    batchedGas: bigint;
    individualGas: bigint;
    savings: bigint;
  }> {
    try {
      // Calculate gas for individual transactions
      const individualGasEstimates = await Promise.all(
        operations.map(async op =>
          this.gasOptimizer.calculateOptimalGasStrategy(
            ethers.ethers.parseEther(op.expectedProfit),
            this.determineComplexity(op)
          )
        )
      );

      const totalIndividualGas = individualGasEstimates.reduce(
        (sum, strategy) => sum + BigInt(strategy.gasLimit),
        BigInt(0)
      );

      // Calculate gas for batched transaction
      const batchedGasStrategy = await this.gasOptimizer.calculateOptimalGasStrategy(
        ethers.ethers.parseEther(operations[0].expectedProfit),
        this.determineComplexity(operations[0])
      );

      const savings = totalIndividualGas - BigInt(batchedGasStrategy.gasLimit);

      return {
        batchedGas: BigInt(batchedGasStrategy.gasLimit),
        individualGas: totalIndividualGas,
        savings
      };
    } catch (error) {
      logger.error('Failed to calculate batch savings:', error as Error);
      throw error;
    }
  }

  public async executeFlashLoan(params: FlashLoanParams): Promise<string> {
    try {
      const providerUrl = process.env.PROVIDER_URL;
      const privateKey = process.env.PRIVATE_KEY;
      const zeroCapitalArbTraderAddress = process.env.ZERO_CAPITAL_ARB_TRADER_ADDRESS; // Add ZeroCapitalArbTrader address

      logger.info(
        `Executing zero-capital flash loan via ZeroCapitalArbTrader: token=${params.token}, amount=${params.amount}, protocol=${params.protocol}`
      );

      if (!providerUrl || !zeroCapitalArbTraderAddress || !privateKey) {
        logger.error(
          `Missing configuration: providerUrl=${providerUrl}, zeroCapitalArbTraderAddress=${zeroCapitalArbTraderAddress}, privateKey=${privateKey}`
        );
        throw new Error(
          'Missing provider URL, ZeroCapitalArbTrader contract address, or private key'
        );
      }

      const provider = new ethers.ethers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.ethers.Wallet(privateKey, provider);
      const zeroCapitalArbTrader = new ethers.Contract(
        zeroCapitalArbTraderAddress,
        ['function requestFlashLoan(address asset, uint256 amount) external'], // ABI for requestFlashLoan
        wallet
      );

      const tx = await zeroCapitalArbTrader.requestFlashLoan(
        params.token,
        ethers.ethers.parseEther(params.amount)
      );

      await tx.wait();

      logger.info(
        `ZeroCapitalArbTrader flash loan initiated successfully: txHash=${tx.hash}`
      );
      console.log(
        `ZeroCapitalArbTrader flash loan initiated successfully: txHash=${tx.hash}`
      );
      return tx.hash;
    } catch (error: any) {
      logger.error(
        'ZeroCapitalArbTrader flash loan execution failed:',
        error instanceof Error ? error : new Error(String(error)),
        params
      );
      console.error(
        'ZeroCapitalArbTrader flash loan execution failed:',
        error.message
      );
      throw error;
    }
  }
}
