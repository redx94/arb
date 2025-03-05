// @ts-nocheck
import type { Balance, TradeDetails } from '../types/index.js';
import { PriceFeed } from './priceFeeds.js';
import { GasAwareFlashLoanProvider } from './gas/GasAwareFlashLoan.js';
import { RiskManager } from './riskManager.js';
import { Logger } from './monitoring.js';
import { walletManager } from './wallet.js';
import { ethers } from 'ethers';
import { GasOptimizer } from './gas/GasOptimizer.js';

class TradeExecutor {
  private logger = Logger.getInstance();
  private balances: Balance[] = [
    { asset: 'ETH', dexAmount: 10n, cexAmount: 10n, pending: 0n }, // bigint - Corrected initialization
  ];
  private walletManagerInstance = walletManager; // Instantiate WalletManager

  public getBalances(): Balance[] {
    return this.balances;
  }

  public async executeTrade(
    type: 'BUY' | 'SELL',
    platform: 'dex' | 'cex', // Enforce 'dex' | 'cex' type
    amount: string,
    price: bigint, // bigint
    token: string,
    protocol: 'AAVE' | 'DYDX' | 'UNISWAP'
  ): Promise<{ success: boolean; trade?: TradeDetails; error?: string }> {
    try {
      this.logger.info(`Executing trade: type=${type}, platform=${platform}, amount=${amount}, price=${price}, token=${token}, protocol=${protocol}`);

      const amountNumber = BigInt(amount);
      if (isNaN(Number(amountNumber)) || amountNumber <= 0n) {
        this.logger.error(`Invalid trade amount: amount=${amount}`);
        throw new Error('Invalid trade amount');
      }

      // Validate trade using RiskManager
      const riskManager = RiskManager.getInstance();
      const priceFeed = PriceFeed.getInstance();
      const priceData = await priceFeed.getCurrentPrice(platform); // Pass platform argument
      if (!priceData) {
        throw new Error('Failed to fetch current price');
      }
      riskManager.validateTrade({ dex: Number(priceData.dex), cex: Number(priceData.cex), amount: Number(amountNumber) });

      const gasAwareFlashLoanProvider = new GasAwareFlashLoanProvider();
      // Dynamically determine flash loan parameters based on trade details
      const flashLoanParams = {
        amount: amount,
        token: token,
        protocol: protocol,
        expectedProfit: (amountNumber * price / 100n).toString(), // Example: 1% of trade value using bigint arithmetic
        maxSlippage: 0.01,
        deadline: Date.now() + 60000, // 1 minute
      };

      let flashLoanUsed = false;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // Execute flash loan
          await gasAwareFlashLoanProvider.executeFlashLoan(flashLoanParams);
          flashLoanUsed = true;
          break; // If flash loan succeeds, break out of the retry loop
        } catch (flashLoanError: any) {
          this.logger.warn(`Flash loan failed (attempt ${retryCount + 1}): ${flashLoanError.message}`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }

      if (!flashLoanUsed) {
        this.logger.error('Flash loan failed after multiple retries. Trade execution aborted.');
        return { success: false, error: 'Flash loan failed after multiple retries. Trade execution aborted.' };
      }

      const tradeDetails: TradeDetails = {
        id: Math.random().toString(36).substring(2, 15),
        type,
        platform,
        amount: BigInt(amountNumber),
        price: BigInt(price),
        effectivePrice: BigInt(price),
        profitLoss: 0n,
        priceImpact: 0n,
        gasCost: 0n,
        timestamp: Date.now(),
        status: 'COMPLETED',
        warnings: [],
        executedPrice: 0n,
        slippage: 0n,
        feeStructure: {
          makerFee: 0n,
          takerFee: 0n,
        },
      };

      this.logger.info(`Trade details: ${JSON.stringify(tradeDetails)}`);

      this.logger.info(`Trade executed successfully: id=${tradeDetails.id}, flashLoanUsed=${flashLoanUsed}, tradeDetails=${JSON.stringify(tradeDetails)}`);
      console.log(`Trade executed successfully: id=${tradeDetails.id}, flashLoanUsed=${flashLoanUsed}, tradeDetails=${JSON.stringify(tradeDetails)}`);

      // Deposit profit to wallet and allocate for future gas fees
      await this.depositProfit(tradeDetails);

      return { success: true, trade: tradeDetails };
    } catch (error: any) {
      this.logger.error('Trade execution failed:', error, {
        type,
        platform,
        amount,
        price,
      });
      console.error(`Trade execution failed: ${error.message}, type=${type}, platform=${platform}, amount=${amount}, price=${price}`);
      return { success: false, error: error.message };
    }
  }

  async calculateProfit(trade: TradeDetails): Promise<bigint> {
    // Basic profit calculation: (sell price - buy price) * amount
    const profitBigint =
      (trade.type === 'SELL' ? 1n : -1n) *
      trade.amount *
      (trade.effectivePrice - trade.price);

    // Estimate gas cost using GasOptimizer
    const gasOptimizer = GasOptimizer.getInstance();
    try {
      const gasStrategy = await gasOptimizer.calculateOptimalGasStrategy(profitBigint);
      const gasCost = BigInt(gasStrategy.baseGas) + BigInt(gasStrategy.priorityFee) * BigInt(gasStrategy.gasLimit);

      // Subtract gas costs from profit
      const profitAfterGas = profitBigint - gasCost;
      return profitAfterGas;
    } catch (error: any) {
      this.logger.error('Error calculating gas costs:', error);
      console.error('Error calculating gas costs:', error);
      return 0n; // Return 0 if gas cost calculation fails
    }
  }

  private async depositProfit(tradeDetails: TradeDetails): Promise<void> {
    try {
      const profit = await this.calculateProfit(tradeDetails); // Await profit calculation
      const walletAddress = process.env.WALLET_ADDRESS; // Get wallet address from env variable

      if (!walletAddress) {
        this.logger.error('WALLET_ADDRESS environment variable not set.');
        console.error('WALLET_ADDRESS environment variable not set.');
        return;
      }

      if (profit <= 0n) {
        this.logger.info('No profit to deposit.');
        console.log('No profit to deposit.');
        return;
      }

      const value = ethers.ethers.parseEther(ethers.ethers.formatEther(profit)); // Use ethers.parseEther and formatEther
      const gasAllocationPercentage =
        parseFloat(process.env.GAS_ALLOCATION_PERCENTAGE || '0.05'); // Default: 5%

      const gasAllocation = BigInt(
        Math.floor(Number(profit) * gasAllocationPercentage)
      );
      const profitAfterGasAllocation = profit - gasAllocation;

      try {
        const tx = await this.walletManagerInstance.signTransaction(
          walletAddress, // Use walletAddress from env variable
          walletAddress,
          ethers.ethers.formatEther(profitAfterGasAllocation)
        );
        const txHash = await this.walletManagerInstance.sendTransaction(tx);
        this.logger.info(
          `Profit deposited to wallet ${walletAddress}, TX hash: ${txHash}`
        );
        console.log(
          `Profit deposited to wallet ${walletAddress}, TX hash: ${txHash}`
        );
        this.logger.info(
          `Allocated ${ethers.ethers.formatEther(gasAllocation)} ETH for future gas fees.`
        );
        console.log(
          `Allocated ${ethers.ethers.formatEther(gasAllocation)} ETH for future gas fees.`
        );
      } catch (signError: any) {
        this.logger.error('Error signing/sending transaction:', signError);
        console.error('Error signing/sending transaction:', signError);
      }
    } catch (error: any) {
      this.logger.error(
        'Error depositing profit:',
        error instanceof Error ? error : new Error(String(error))
      );
      console.error('Error depositing profit:', error);
    }
  }
}

export const tradeExecutor = new TradeExecutor();
