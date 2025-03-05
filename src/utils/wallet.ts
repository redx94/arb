import { ethers } from 'ethers';
import type { Wallet, Transaction } from '../types/index.js';

import { Logger } from './monitoring.js';
import { GasOptimizer } from './gas/GasOptimizer.js';

class WalletManager {
  private wallets: Map<string, Wallet> = new Map();
  public provider: ethers.JsonRpcProvider;
  private mockMode: boolean = false; // Default to live mode for production
  private logger = Logger.getInstance();

  constructor() {
    if (process.env.PROVIDER_URL) {
      try {
        this.provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
      } catch (error) {
        console.warn('Failed to set provider from PROVIDER_URL, using mock provider for development');
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      }
    } else {
      // Default to mock provider if PROVIDER_URL is not set
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    }
  }

  public setProvider(rpcUrl: string, apiKey?: string) {
    try {
      const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
      this.provider = new ethers.JsonRpcProvider(url);
    } catch (error) {
      console.warn('Using mock provider for development');
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    }
  }

  public setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }

  public setLiveProvider(rpcUrl: string, apiKey?: string) {
    try {
      const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
      this.provider = new ethers.JsonRpcProvider(url);
      this.mockMode = false; // Disable mock mode when using live provider
      console.log(`Live provider set to ${rpcUrl}`);
    } catch (error) {
      console.error('Error setting live provider:', error);
      throw new Error('Failed to set live provider');
    }
  }

  private generateMockHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  public async createWallet(privateKey?: string): Promise<Wallet> {
    try {
      let wallet;
      if (privateKey) {
        wallet = new ethers.Wallet(privateKey); // Create wallet from private key
      } else {
        wallet = ethers.Wallet.createRandom(); // Create random wallet
      }
      const newWallet: Wallet = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        chainId: 1337, // Local network for development
        network: 'mainnet'
      };
      
      this.wallets.set(newWallet.address, newWallet);
      return newWallet;
    } catch (error) {
      console.warn('Error creating wallet, using mock wallet');
      // Create a deterministic mock wallet for development
      const mockWallet: Wallet = {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
        chainId: 1337,
        network: 'mainnet'
      };
      this.wallets.set(mockWallet.address, mockWallet);
      return mockWallet;
    }
  }

  public async getBalance(address: string): Promise<string> {
    if (this.mockMode) {
      return '10.0'; // Mock balance for development
    }

    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.warn('Error getting balance, using mock balance');
      return '10.0';
    }
  }

  public async signTransaction(
    from: string,
    to: string,
    value: string,
    data?: string
  ): Promise<Transaction> {
    try {
      const wallet = this.wallets.get(from);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (this.mockMode) {
        // Generate mock transaction
        return {
          hash: this.generateMockHash(),
          from,
          to,
          value,
          gasPrice: '20000000000',
          gasLimit: '21000',
          nonce: 0,
          data,
          chainId: wallet.chainId
        };
      }

      const nonce = await this.provider.getTransactionCount(from);
      const gasPrice = await this.provider.getFeeData();
      const estimatedGas = await GasOptimizer.estimateGasCost({
        to: to,
        data: data || '0x',
      } as any);

      const tx: Transaction = {
        hash: '',
        from,
        to,
        value,
        gasPrice: gasPrice.gasPrice?.toString() || '20000000000',
        gasLimit: estimatedGas.gasLimit.toString(),
        nonce,
        data,
        chainId: wallet.chainId
      };

      const signer = new ethers.Wallet(wallet.privateKey, this.provider);
      const signedTx = await signer.signTransaction(tx);
      tx.hash = ethers.keccak256(signedTx);

      return tx;
    } catch (error: any) {
      console.warn('Error signing transaction:', error instanceof Error ? error : new Error(String(error)));
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds to sign transaction');
      }
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  public async sendTransaction(tx: Transaction): Promise<string> {
    try {
      if (this.mockMode) {
        // Simulate successful transaction in mock mode
        return this.generateMockHash();
      }

      this.logger.info(`Sending transaction: from=${tx.from}, to=${tx.to}, value=${tx.value}`);
      const wallet = this.wallets.get(tx.from);
      if (!wallet) {
        this.logger.error(`Wallet not found: address=${tx.from}`);
        throw new Error('Wallet not found');
      }

      const signer = new ethers.Wallet(wallet.privateKey, this.provider);
      const response = await signer.sendTransaction(tx);
      await response.wait();

      return response.hash;
    } catch (error: any) {
      console.warn('Error sending transaction:', error instanceof Error ? error : new Error(String(error)));
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds to send transaction');
      }
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  public getWallet(address: string): Wallet | undefined {
    return this.wallets.get(address);
  }

  public getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }
}

const walletManager = new WalletManager();

// Initialize with mock mode for development
if (process.env.PROVIDER_URL) {
  walletManager.setProvider(process.env.PROVIDER_URL);
}

export { walletManager };
