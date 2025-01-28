import { ethers } from 'ethers';
import { GasOptimizer } from './GasOptimizer';
import { Logger } from '../monitoring';
import type { FlashLoanParams } from '../flashLoanHandler';

const logger = Logger.getInstance();

export class GasAwareFlashLoan {
  private readonly gasOptimizer: GasOptimizer;
  private readonly MIN_PROFIT_THRESHOLD = 0.02; // 2% minimum profit after gas

  constructor() {
    this.gasOptimizer = GasOptimizer.getInstance();
  }

  public async validateAndOptimize(params: FlashLoanParams): Promise<{
    isViable: boolean;
    optimizedGas: ethers.BigNumber;
    expectedProfit: ethers.BigNumber;
    recommendation: string;
  }> {
    try {
      const expectedProfit = ethers.parseEther(params.expectedProfit);
      const amount = ethers.parseEther(params.amount);

      // Get optimal gas strategy
      const gasStrategy = await this.gasOptimizer.calculateOptimalGasStrategy(
        expectedProfit,
        this.determineComplexity(params)
      );

      // Calculate total gas cost
      const totalGasCost = gasStrategy.baseGas
        .add(gasStrategy.priorityFee)
        .mul(gasStrategy.gasLimit);

      // Calculate net profit after gas
      const netProfit = expectedProfit.sub(totalGasCost);
      const profitMargin = Number(netProfit) / Number(expectedProfit);

      // Check if trade is viable
      const isViable = profitMargin >= this.MIN_PROFIT_THRESHOLD;

      let recommendation = '';
      if (!isViable) {
        recommendation = this.generateOptimizationRecommendation(
          profitMargin,
          totalGasCost,
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
    
    // Determine complexity based on amount and protocol
    if (amount.gt(ethers.parseEther('1000'))) return 'high';
    if (amount.gt(ethers.parseEther('100'))) return 'medium';
    return 'low';
  }

  private generateOptimizationRecommendation(
    profitMargin: number,
    gasCost: ethers.BigNumber,
    expectedProfit: ethers.BigNumber
  ): string {
    if (profitMargin < 0) {
      return 'Transaction would result in a loss due to gas costs. Consider increasing trade size or waiting for lower gas prices.';
    }

    if (profitMargin < this.MIN_PROFIT_THRESHOLD) {
      const requiredProfitIncrease = ethers.parseEther(
        (this.MIN_PROFIT_THRESHOLD - profitMargin).toString()
      );
      return `Profit margin too low. Need additional $${ethers.formatEther(requiredProfitIncrease)} in profit for viability.`;
    }

    return 'Consider batching multiple operations to share gas costs.';
  }

  public async batchTransactions(
    operations: FlashLoanParams[]
  ): Promise<{
    batchedGas: ethers.BigNumber;
    individualGas: ethers.BigNumber;
    savings: ethers.BigNumber;
  }> {
    try {
      // Calculate gas for individual transactions
      const individualGasPromises = operations.map(op =>
        this.gasOptimizer.estimateFlashLoanGas(
          op.token,
          ethers.parseEther(op.amount),
          1
        )
      );
      
      const individualGasEstimates = await Promise.all(individualGasPromises);
      const totalIndividualGas = individualGasEstimates.reduce(
        (sum, gas) => sum.add(gas),
        ethers.BigNumber.from(0)
      );

      // Calculate gas for batched transaction
      const batchedGas = await this.gasOptimizer.estimateFlashLoanGas(
        operations[0].token,
        ethers.parseEther(operations[0].amount),
        operations.length
      );

      const savings = totalIndividualGas.sub(batchedGas);

      return {
        batchedGas,
        individualGas: totalIndividualGas,
        savings
      };
    } catch (error) {
      logger.error('Failed to calculate batch savings:', error as Error);
      throw error;
    }
  }
}