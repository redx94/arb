import { ethers } from 'ethers';
import { networks } from './networks';
import { protocolAddresses } from './protocols';
import { walletManager } from '../wallet';
class ConfigManager {
    constructor() {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "providers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    async initialize(networkName = 'local', apiKey) {
        const network = networks[networkName];
        if (!network) {
            throw new Error(`Network ${networkName} not supported`);
        }
        const protocols = protocolAddresses[networkName] || protocolAddresses.mainnet;
        this.config = {
            network,
            protocols,
            fallbackProviders: [
                'https://eth-mainnet.infura.io/v3',
                'https://rpc.ankr.com/eth'
            ],
            maxRetries: 3,
            retryDelay: 1000
        };
        await this.setupProviders(network, apiKey);
    }
    async setupProviders(network, apiKey) {
        try {
            // Setup main provider
            const mainProvider = this.createProvider(network.rpcUrl, apiKey);
            this.providers.set('main', mainProvider);
            // Setup WebSocket provider if available
            if (network.wsUrl) {
                const wsProvider = this.createWebSocketProvider(network.wsUrl, apiKey);
                this.providers.set('ws', wsProvider);
            }
            // Initialize wallet manager with main provider
            walletManager.setProvider(network.rpcUrl, apiKey);
        }
        catch (error) {
            console.error('Failed to setup providers:', error);
            // Fallback to local provider
            const localProvider = new ethers.JsonRpcProvider('http://localhost:8545');
            this.providers.set('main', localProvider);
            walletManager.setProvider('http://localhost:8545');
        }
    }
    createProvider(rpcUrl, apiKey) {
        const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
        return new ethers.JsonRpcProvider(url);
    }
    createWebSocketProvider(wsUrl, apiKey) {
        const url = apiKey ? `${wsUrl}/${apiKey}` : wsUrl;
        return new ethers.WebSocketProvider(url);
    }
    getProvider(type = 'main') {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new Error(`Provider ${type} not initialized`);
        }
        return provider;
    }
    getConfig() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return this.config;
    }
    getProtocolConfig() {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return this.config.protocols;
    }
}
export const configManager = ConfigManager.getInstance();
