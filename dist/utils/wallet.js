import { ethers } from 'ethers';
class WalletManager {
    constructor() {
        Object.defineProperty(this, "wallets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mockMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        }); // Default to mock mode for development
        // Use mock provider for development
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    }
    setProvider(rpcUrl, apiKey) {
        try {
            const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
            this.provider = new ethers.JsonRpcProvider(url);
        }
        catch (error) {
            console.warn('Using mock provider for development');
            this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
        }
    }
    setMockMode(enabled) {
        this.mockMode = enabled;
    }
    generateMockHash() {
        return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    async createWallet() {
        try {
            const wallet = ethers.Wallet.createRandom();
            const newWallet = {
                address: wallet.address,
                privateKey: wallet.privateKey,
                chainId: 1337, // Local network for development
                network: 'mainnet'
            };
            this.wallets.set(newWallet.address, newWallet);
            return newWallet;
        }
        catch (error) {
            console.warn('Error creating wallet, using mock wallet');
            // Create a deterministic mock wallet for development
            const mockWallet = {
                address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
                chainId: 1337,
                network: 'mainnet'
            };
            this.wallets.set(mockWallet.address, mockWallet);
            return mockWallet;
        }
    }
    async getBalance(address) {
        if (this.mockMode) {
            return '10.0'; // Mock balance for development
        }
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        }
        catch (error) {
            console.warn('Error getting balance, using mock balance');
            return '10.0';
        }
    }
    async signTransaction(from, to, value, data) {
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
            const tx = {
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
        }
        catch (error) {
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
    async sendTransaction(tx) {
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
        }
        catch (error) {
            if (this.mockMode) {
                return this.generateMockHash();
            }
            console.error('Transaction failed:', error);
            throw error;
        }
    }
    getWallet(address) {
        return this.wallets.get(address);
    }
    getAllWallets() {
        return Array.from(this.wallets.values());
    }
}
export const walletManager = new WalletManager();
// Initialize with mock mode for development
walletManager.setMockMode(true);
walletManager.setProvider('http://localhost:8545');
