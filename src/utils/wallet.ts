import { ethers } from 'ethers';
import type { Wallet, Transaction } from '../types';

class WalletManager {
  private wallets: Map<string, Wallet> = new Map();
  public provider: ethers.JsonRpcProvider;
  private mockMode: boolean = true; // Default to mock mode for development

  constructor() {
    // Use mock provider for development
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
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

  private generateMockHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  public async createWallet(): Promise<Wallet> {
    try {
      const wallet = ethers.Wallet.createRandom();
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
    const wallet = this.wallets.get(from);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
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
      
      const tx: Transaction = {
        hash: '',
        from,
        to,
        value,
        gasPrice: gasPrice.gasPrice?.toString() || '20000000000',
        gasLimit: '21000',
        nonce,
        data,
        chainId: wallet.chainId
      };

      const signer = new ethers.Wallet(wallet.privateKey, this.provider);
      const signedTx = await signer.signTransaction(tx);
      tx.hash = ethers.keccak256(signedTx);

      return tx;
    } catch (error) {
      if (this.mockMode) {
        // Return mock transaction on error in mock mode
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
      console.warn('Error signing transaction:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  public async sendTransaction(tx: Transaction): Promise<string> {
    if (this.mockMode) {
      // Simulate successful transaction in mock mode
      return this.generateMockHash();
    }

    try {
      const wallet = this.wallets.get(tx.from);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const signer = new ethers.Wallet(wallet.privateKey, this.provider);
      const response = await signer.sendTransaction(tx);
      await response.wait();
      
      return response.hash;
    } catch (error) {
      if (this.mockMode) {
        return this.generateMockHash();
      }
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  public getWallet(address: string): Wallet | undefined {
    return this.wallets.get(address);
  }

  public getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }
}

export const walletManager = new WalletManager();

// Initialize with mock mode for development
walletManager.setMockMode(true);
walletManager.setProvider('http://localhost:8545');