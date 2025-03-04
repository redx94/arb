import { ethers } from 'ethers';
import { GasOptimizer } from './GasOptimizer.js';
import { Logger } from '../monitoring.js';
import type { FlashLoanParams } from '../flashLoanHandler.js';
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
      const expectedProfit = ethers.parseEther(params.expectedProfit);

      // Get optimal gas strategy
      const gasStrategy = await this.gasOptimizer.calculateOptimalGasStrategy(
        expectedProfit,
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
    const amount = ethers.parseEther(params.amount);

    // Determine complexity using native BigInt comparisons
    if (amount > ethers.parseEther('1000')) {
      return 'high';
    }
    if (amount > ethers.parseEther('100')) {
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
      return `Profit margin too low. Need additional $${ethers.formatEther(requiredProfitIncrease)} in profit for viability.`;
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
            ethers.parseEther(op.expectedProfit),
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
        ethers.parseEther(operations[0].expectedProfit),
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
      const flashLoanContractAddress = process.env.FLASH_LOAN_CONTRACT_ADDRESS;
      const privateKey = process.env.PRIVATE_KEY;

      if (!providerUrl || !flashLoanContractAddress || !privateKey) {
        throw new Error('Missing provider URL, flash loan contract address, or private key');
      }

      const provider = new ethers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const aaveIntegration = new AaveIntegration();
      const result = await aaveIntegration.executeFlashLoan(
        params.token,
        params.amount,
        wallet.address, // Use the wallet address as the receiver
        '' // Replace with the actual parameters for the flash loan
      );

      if (result.success) {
        if (result.txHash) {
          logger.info(`Flash loan executed successfully: txHash=${result.txHash}`);
          console.log(`Flash loan executed successfully: txHash=${result.txHash}`);
          return result.txHash;
        } else {
          logger.error('Flash loan execution failed: txHash is undefined', new Error('Flash loan execution failed: txHash is undefined'));
          console.error('Flash loan execution failed: txHash is undefined');
          throw new Error('Flash loan execution failed: txHash is undefined');
        }
      } else {
        if (result.error) {
          logger.error('Flash loan execution failed:', new Error(result.error), params);
          console.error('Flash loan execution failed:', result.error);
          throw new Error(String(result.error));
        } else {
          logger.error('Flash loan execution failed:', new Error('Unknown error'), params);
          console.error('Flash loan execution failed: Unknown error');
          throw new Error('Unknown error');
        }
      }
    } catch (error: any) {
      logger.error('Flash loan execution failed:', error instanceof Error ? error : new Error(String(error)), params);
      console.error('Flash loan execution failed:', error.message);
      throw error;
    }
  }
}
