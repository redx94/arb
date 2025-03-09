import * as ethers from 'ethers';
import { Logger } from './monitoring.cjs';

interface WalletInfo {
    address: string;
    privateKey: string;
    chainId: number;
    network: string;
}

class WalletManager {
    private wallets: Map<string, WalletInfo> = new Map();
    private provider: ethers.providers.JsonRpcProvider;
    private mockMode: boolean = false; // Default to live mode for production
    private logger: Logger = Logger.getInstance();

    constructor() {
        try {
            if (process.env.PROVIDER_URL) {
                this.provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
            } else {
                // Default to mock provider if PROVIDER_URL is not set
                this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
            }
        } catch (error) {
            console.warn('Failed to set provider from PROVIDER_URL using mock provider for development');
            this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        }
    }

    public setProvider(rpcUrl: string, apiKey?: string): void {
        try {
            const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
            this.provider = new ethers.providers.JsonRpcProvider(url);
        } catch (error) {
            console.warn('Using mock provider for development');
            this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        }
    }

    public setMockMode(enabled: boolean): void {
        this.mockMode = enabled;
    }

    public setLiveProvider(rpcUrl: string, apiKey?: string): void {
        try {
            const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
            this.provider = new ethers.providers.JsonRpcProvider(url);
        } catch (error) {
            console.error('Error setting live provider:', error);
            throw new Error('Failed to set live provider');
        }
    }

    private generateMockHash(): string {
        return '0x' + Array.from({ length: 64 }, () => {
            return Math.floor(Math.random() * 16).toString(16);
        }).join('');
    }

    public async createWallet(privateKey?: string): Promise<WalletInfo> {
        let wallet: ethers.Wallet;
        try {
            if (privateKey) {
                wallet = new ethers.Wallet(privateKey); // Create wallet from private key
            } else {
                wallet = ethers.Wallet.createRandom(); // Create random wallet
            }

            const newWallet: WalletInfo = {
                address: wallet.address,
                privateKey: wallet.privateKey!,
                chainId: 1337, // Local network for development
                network: 'mainnet'
            };

            this.wallets.set(newWallet.address, newWallet);
            return newWallet;
        } catch (error) {
            console.warn('Error creating wallet, using mock wallet');
            const mockWallet: WalletInfo = {
                address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
                chainId: 1337, // Local network for development
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
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.warn('Error getting balance, using mock balance');
            return '10.0';
        }
    }

    public async signTransaction(from: string, to: string, value: string, data: string): Promise<any> {
        try {
            const wallet = this.wallets.get(from);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (this.mockMode) {
                // Generate mock transaction
                return {
                    hash: this.generateMockHash(),
                    from: from,
                    to: to,
                    value: value,
                    gasPrice: '20000000000',
                    gasLimit: '21000',
                    nonce: 0,
                    data: data,
                    chainId: wallet.chainId
                };
            }

            const nonce = await this.provider.getTransactionCount(from);
            const gasPrice = await this.provider.getFeeData();

            const tx = {
                hash: '',
                from: from,
                to: to,
                value: value,
                gasPrice: gasPrice.gasPrice ? gasPrice.gasPrice.toString() : '20000000000',
                gasLimit: '21000',
                nonce: nonce,
                data: data,
                chainId: wallet.chainId
            };

            const signer = new ethers.Wallet(wallet.privateKey, this.provider);
            const signedTx = await signer.signTransaction(tx);
            tx.hash = ethers.utils.keccak256(signedTx);

            return tx;
        } catch (error: any) {
            console.warn('Error signing transaction:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Failed to sign transaction');
        }
    }

    public async sendTransaction(tx: any): Promise<string> {
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
            throw new Error('Failed to send transaction');
        }
    }

    public getWallet(address: string): WalletInfo | undefined {
        return this.wallets.get(address);
    }

    public getAllWallets(): WalletInfo[] {
        return Array.from(this.wallets.values());
    }
}

export const walletManager = new WalletManager();
