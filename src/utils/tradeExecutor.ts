import { ethers } from 'ethers';
import type { Trade, TradeResult, Balance, Transaction } from '../types';
import { walletManager } from './wallet';
import { RiskManager } from './riskManager';
import { configManager } from './config';

class TradeExecutor {
  private balances: Balance[] = [];
  private readonly MIN_CONFIRMATION_BLOCKS = 2;
  private riskManager = RiskManager.getInstance();
  private mockMode = true; // Default to mock mode for development

  constructor() {
    this.initializeBalances();
  }

  private async initializeBalances() {
    const wallet = await walletManager.createWallet();
    this.balances = [
      {
        asset: 'ETH',
        dexAmount: ethers.BigNumber.from(10),
        cexAmount: ethers.BigNumber.from(10),
        wallet: wallet.address,
        pending: ethers.BigNumber.from(0)
      },
      {
        asset: 'USDT',
        dexAmount: ethers.BigNumber.from(50000),
        cexAmount: ethers.BigNumber.from(50000),
        wallet: wallet.address,
        pending: ethers.BigNumber.from(0)
      }
    ];
  }

  private calculateSlippage(amount: number, platform: 'DEX' | 'CEX'): number {
    const baseSlippage = amount * 0.001;
    return platform === 'DEX' ? baseSlippage * 2 : baseSlippage;
  }

  private async calculateGasCost(platform: 'DEX' | 'CEX'): Promise<number> {
    if (platform === 'CEX' || this.mockMode) {
      return 0.0001; // Mock gas cost for development
    }

    try {
      const provider = configManager.getProvider();
      const [gasPrice, block] = await Promise.all([
        provider.getFeeData(),
        provider.getBlock('latest')
      ]);

      if (!gasPrice.gasPrice || !block) {
        return 0.0001; // Fallback to mock gas cost
      }

      // Use EIP-1559 fees when available
      const effectiveGasPrice = gasPrice.maxFeePerGas || gasPrice.gasPrice;
      const gasLimit = ethers.getBigInt('21000'); // Basic ETH transfer
      const gasCost = effectiveGasPrice * gasLimit;

      // Convert to ETH and return with 4 decimal places
      return Number(ethers.formatEther(gasCost)).toFixed(4) as unknown as number;
    } catch (error) {
      console.warn('Using mock gas cost due to calculation error');
      return 0.0001; // Fallback to mock gas cost
    }
  }

  private async createTransaction(
    type: 'BUY' | 'SELL',
    platform: 'DEX' | 'CEX',
    amount: number,
    price: number
  ): Promise<Transaction> {
    const balance = this.balances.find(b => b.asset === 'ETH');
    if (!balance) throw new Error('No ETH balance found');

    const value = ethers.parseEther(amount.toString());

    return await walletManager.signTransaction(
      balance.wallet,
      platform === 'DEX' ? 'DEX_CONTRACT_ADDRESS' : 'CEX_CONTRACT_ADDRESS',
      value.toString(),
      type === 'BUY' ? '0x' : undefined
    );
  }

  private async updateBalance(trade: Trade): Promise<void> {
    const balance = this.balances.find(b =>
      b.asset === (trade.amount > 1000 ? 'USDT' : 'ETH')
    );

    if (balance) {
      if (trade.platform === 'DEX') {
        balance.dexAmount += trade.type === 'BUY' ? trade.amount : -trade.amount;
        balance.pending = trade.status === 'PENDING' ? BigInt(trade.amount) : BigInt(0);
      } else {
        balance.cexAmount += trade.type === 'BUY' ? trade.amount : -trade.amount;
      }
    }
  }

  public setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }

  public getBalances(): Balance[] {
    return [...this.balances];
  }

  public async executeTrade(
    type: 'BUY' | 'SELL',
    platform: 'DEX' | 'CEX',
    amount: number,
    price: number
  ): Promise<TradeResult> {
    try {
      // Validate trade with risk manager first
      const balance = this.balances.find(b => b.asset === 'ETH');
      if (!balance) throw new Error('No ETH balance found');

      this.riskManager.validateTrade(
        { type, platform, amount: BigInt(amount), price } as Trade,
        balance,
        { dex: price, cex: price, timestamp: Date.now() }
      );

      const slippage = this.calculateSlippage(amount, platform);
      const gasCost = await this.calculateGasCost(platform);

      // Create and sign transaction
      const transaction = await this.createTransaction(type, platform, amount, price);

      const trade: Trade = {
        id: Math.random().toString(36).substring(7),
        type,
        platform,
        amount: BigInt(amount),
        price,
        timestamp: Date.now(),
        status: 'PENDING',
        slippage,
        gasCost: BigInt(gasCost),
        transaction
      };

      // Send transaction
      if (platform === 'DEX') {
        const txHash = await walletManager.sendTransaction(transaction);
        trade.transaction = { ...transaction, hash: txHash };
      }

      await this.updateBalance(trade);
      trade.status = 'COMPLETED';

      return {
        success: true,
        message: 'Trade executed successfully',
        trade
      };
    } catch (error) {
      return {
        success: false,
        message: 'Trade execution failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const tradeExecutor = new TradeExecutor();
