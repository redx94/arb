import { ethers } from 'ethers';
import { FlashLoanProvider, AaveV3 } from '@aave/protocol-js';
import type { Trade, Balance, TradeDetails } from '../../types';
import { getGasPrice } from './gas/GasOptimizer';
import { SecurityManager } from './production/SecurityManager';

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const aave = new AaveV3(provider, process.env.NETWORK);

export const tradeExecutor = {
  async executeTrade(
    type: 'BUY' | 'SELL',
    tokenPair: string,
    amount: string,
    routes: string[]
  ): Promise<{ success: boolean; trade?: TradeDetails; error?: string }> {
    try {
      SecurityManager.verifyLiveEnvironment();
      
      // Initiate flash loan
      const flashLoan = await FlashLoanProvider.initiate({
        provider: aave,
        assets: [tokenPair],
        amounts: [amount],
        modes: [0], // 0 = no debt, 1 = stable, 2 = variable
      });

      // Execute arbitrage strategy
      const tradeTx = await flashLoan.executeStrategy(
        routes,
        { gasPrice: await getGasPrice() }
      );

      // Wait for transaction confirmation
      const receipt = await tradeTx.wait();
      
      return {
        success: receipt.status === 1,
        trade: {
          id: receipt.transactionHash,
          type,
          platform: 'Aave V3',
          amount: parseFloat(amount),
          price: await this.calculateEffectivePrice(receipt),
          effectivePrice: await this.calculateEffectivePrice(receipt),
          profitLoss: await this.calculateProfit(receipt),
          priceImpact: await this.calculatePriceImpact(receipt),
          gasCost: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
          timestamp: (await provider.getBlock(receipt.blockNumber)).timestamp,
          status: receipt.status === 1 ? 'COMPLETED' : 'FAILED',
          warnings: SecurityManager.analyzeTxRisk(receipt)
        }
      };
    } catch (error) {
      SecurityManager.logError(error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async calculateEffectivePrice(receipt: ethers.TransactionReceipt): Promise<number> {
    const tx = await provider.getTransaction(receipt.hash);
    const value = Number(tx?.value);
    return value / Number(receipt.gasUsed);