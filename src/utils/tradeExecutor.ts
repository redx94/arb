import type { Balance, TradeDetails } from '../types/index.js'; // Corrected import path
import { PriceFeed } from './priceFeeds.js'; // Added .js extension
import { GasAwareFlashLoanProvider } from './gas/GasAwareFlashLoan.js'; // Added .js extension
import { RiskManager } from './riskManager.js'; // Added .js extension
import { Logger } from './monitoring.js'; // Added .js extension
import { walletManager } from './wallet.js'; // Added .js extension
import { ethers } from 'ethers'; // Import ethers

class TradeExecutor {
  private logger = Logger.getInstance();
  private balances: Balance[] = [
    { asset: 'ETH', dexAmount: 10n, cexAmount: 10n, pending: 0 }, // bigint - Corrected initialization
  ];
  private walletManagerInstance = walletManager; // Instantiate WalletManager

  public getBalances(): Balance[] {
    return this.balances;
  }

  public async executeTrade(
    type: 'BUY' | 'SELL',
    platform: 'dex' | 'cex', // Enforce 'dex' | 'cex' type
    amount: string,
    price: bigint // bigint
  ): Promise<{ success: boolean; trade?: TradeDetails; error?: string }> {
    try {
      this.logger.info(`Executing trade: type=${type}, platform=${platform}, amount=${amount}, price=${price}`);

      const amountNumber = BigInt(amount);
      if (isNaN(Number(amountNumber)) || amountNumber <= 0n) {
        throw new Error('Invalid trade amount');
      }

      // Validate trade using RiskManager
      const riskManager = RiskManager.getInstance();
      const priceFeed = PriceFeed.getInstance();
      const priceData = await priceFeed.getCurrentPrice(platform); // Pass platform argument
      if (!priceData) {
        throw new Error('Failed to fetch current price');
      }
      riskManager.validateTrade({ dex: priceData.dex, cex: priceData.cex, amount: Number(amountNumber) });

      const gasAwareFlashLoanProvider = new GasAwareFlashLoanProvider();
      // Dynamically determine flash loan parameters based on trade details
      const flashLoanParams = {
        amount: amount,
        token: 'ETH', // Replace with actual token
        protocol: 'AAVE' as 'AAVE' | 'DYDX' | 'UNISWAP', // Replace with actual protocol based on platform
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
        this.logger.error('Flash loan failed after multiple retries. Consider executing the trade without a flash loan.');
        // Implement logic to execute the trade without a flash loan if possible
        // This might involve using your own funds or adjusting the trade parameters
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

      this.logger.info(`Trade executed successfully: id=${tradeDetails.id}, flashLoanUsed=${flashLoanUsed}, tradeDetails=${JSON.stringify(tradeDetails)}`);
      console.log(`Trade executed successfully: id=${tradeDetails.id}, flashLoanUsed=${flashLoanUsed}, tradeDetails=${JSON.stringify(tradeDetails)}`);

      // Deposit profit to wallet
      await this.depositProfit(tradeDetails);

      return { success: true, trade: tradeDetails };
    } catch (error: any) {
      this.logger.error('Trade execution failed:', error, { type, platform, amount, price });
      console.error(`Trade execution failed: ${error.message}, type=${type}, platform=${platform}, amount=${amount}, price=${price}`);
      return { success: false, error: error.message };
    }
  }

  async calculateProfit(trade: TradeDetails): Promise<number> {
    // Basic profit calculation: (sell price - buy price) * amount
    const profitBigint = (trade.type === 'SELL' ? 1n : -1n) * trade.amount * (trade.effectivePrice - trade.price);
    return Number(profitBigint); // Convert bigint to number before returning
  }

  private async depositProfit(tradeDetails: TradeDetails): Promise<void> {
    try {
      const profit = await this.calculateProfit(tradeDetails); // Await profit calculation
      const walletAddress = process.env.WALLET_ADDRESS; // Get wallet address from env variable

      if (!walletAddress) {
        this.logger.error('WALLET_ADDRESS environment variable not set.');
        return;
      }

      if (profit <= 0) {
        this.logger.info('No profit to deposit.');
        return;
      }

      const value = ethers.utils.parseEther(String(profit)); // Use ethers.utils.parseEther
      // Use bigint for profit calculation
      const profitBigint = BigInt(Math.round(profit * Number(tradeDetails.amount))); 
      const tx = await this.walletManagerInstance.signTransaction(
        '0xBBAE4f5F0Ec60fD8796fD92F0DB66893ec2c9e0a', // Replaced placeholder
        walletAddress,
        value.toString()
      );
      const txHash = await this.walletManagerInstance.sendTransaction(tx);
      this.logger.info(`Profit deposited to wallet ${walletAddress}, TX hash: ${txHash}`);
    } catch (error: any) {
      this.logger.error('Error depositing profit:', error);
    }
  }
}

export const tradeExecutor = new TradeExecutor();
