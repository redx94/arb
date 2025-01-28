import { ethers } from 'ethers';
import { Logger } from '../monitoring';
import type { PriceData } from '../../types';

const logger = Logger.getInstance();

export class ProfitCalculator {
  private static instance: ProfitCalculator;
  
  private readonly GAS_PRICE_BUFFER = 1.2; // 20% buffer for gas price fluctuations
  private readonly FLASH_LOAN_FEE = 0.0009; // 0.09% flash loan fee
  private readonly MIN_PROFIT_THRESHOLD = ethers.parseEther('0.01'); // 0.01 ETH

  private constructor() {}

  public static getInstance(): ProfitCalculator {
    if (!ProfitCalculator.instance) {
      ProfitCalculator.instance = new ProfitCalculator();
    }
    return ProfitCalculator.instance;
  }

  public async calculatePotentialProfit(
    buyPrice: number,
    sellPrice: number,
    amount: number,
    priceData: PriceData
  ): Promise<{
    profit: ethers.BigNumber;
    isViable: boolean;
    details: {
      grossProfit: ethers.BigNumber;
      totalCosts: ethers.BigNumber;
      breakdown: {
        flashLoanCost: ethers.BigNumber;
        gasCost: ethers.BigNumber;
        slippageCost: ethers.BigNumber;
      };
    };
  }> {
    try {
      // Convert to BigNumber for precise calculations
      const amountBN = ethers.parseEther(amount.toString());
      const buyPriceBN = ethers.parseEther(buyPrice.toString());
      const sellPriceBN = ethers.parseEther(sellPrice.toString());

      // Calculate gross profit
      const grossProfit = amountBN
        .mul(sellPriceBN.sub(buyPriceBN))
        .div(ethers.parseEther('1'));

      // Calculate costs
      const { flashLoanCost, gasCost, slippageCost } = await this.calculateCosts(
        amountBN,
        buyPriceBN,
        priceData
      );

      const totalCosts = flashLoanCost.add(gasCost).add(slippageCost);
      const netProfit = grossProfit.sub(totalCosts);

      return {
        profit: netProfit,
        isViable: netProfit.gt(this.MIN_PROFIT_THRESHOLD),
        details: {
          grossProfit,
          totalCosts,
          breakdown: {
            flashLoanCost,
            gasCost,
            slippageCost
          }
        }
      };
    } catch (error) {
      logger.error('Error calculating profit:', error as Error);
      throw error;
    }
  }

  private async calculateCosts(
    amount: ethers.BigNumber,
    price: ethers.BigNumber,
    priceData: PriceData
  ): Promise<{
    flashLoanCost: ethers.BigNumber;
    gasCost: ethers.BigNumber;
    slippageCost: ethers.BigNumber;
  }> {
    // Calculate flash loan fee
    const flashLoanCost = amount
      .mul(price)
      .mul(ethers.parseEther(this.FLASH_LOAN_FEE.toString()))
      .div(ethers.parseEther('1'));

    // Estimate gas cost
    const estimatedGasUnits = ethers.getBigInt('250000'); // Estimated gas units for the transaction
    const gasPrice = await this.getGasPrice();
    const gasCost = gasPrice.mul(estimatedGasUnits);

    // Calculate expected slippage
    const slippageCost = this.calculateSlippageCost(amount, price, priceData);

    return {
      flashLoanCost,
      gasCost,
      slippageCost
    };
  }

  private async getGasPrice(): Promise<ethers.BigNumber> {
    try {
      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const gasPrice = await provider.getFeeData();
      
      // Add buffer to gas price
      return ethers.parseUnits(
        (Number(gasPrice.gasPrice) * this.GAS_PRICE_BUFFER).toString(),
        'wei'
      );
    } catch (error) {
      logger.error('Error getting gas price:', error as Error);
      // Return a default high gas price as fallback
      return ethers.parseUnits('100', 'gwei');
    }
  }

  private calculateSlippageCost(
    amount: ethers.BigNumber,
    price: ethers.BigNumber,
    priceData: PriceData
  ): ethers.BigNumber {
    // Calculate slippage based on order size and liquidity
    const baseSlippage = 0.001; // 0.1% base slippage
    const volumeSlippage = amount.mul(price).div(ethers.parseEther('1000')); // Additional slippage based on volume
    
    return amount
      .mul(price)
      .mul(ethers.parseEther((baseSlippage + Number(volumeSlippage)).toString()))
      .div(ethers.parseEther('1'));
  }
}