import { ethers } from 'ethers';
import { networks } from './networks';
import { protocolAddresses } from './protocols';
import { EnvironmentConfig, NetworkConfig } from './types';
import { walletManager } from '../wallet';

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig | null = null;
  private providers: Map<string, ethers.Provider> = new Map();

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async initialize(networkName: string = 'local', apiKey?: string) {
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

  private async setupProviders(network: NetworkConfig, apiKey?: string) {
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

    } catch (error) {
      console.error('Failed to setup providers:', error);
      // Fallback to local provider
      const localProvider = new ethers.JsonRpcProvider('http://localhost:8545');
      this.providers.set('main', localProvider);
      walletManager.setProvider('http://localhost:8545');
    }
  }

  private createProvider(rpcUrl: string, apiKey?: string): ethers.Provider {
    const url = apiKey ? `${rpcUrl}/${apiKey}` : rpcUrl;
    return new ethers.JsonRpcProvider(url);
  }

  private createWebSocketProvider(wsUrl: string, apiKey?: string): ethers.WebSocketProvider {
    const url = apiKey ? `${wsUrl}/${apiKey}` : wsUrl;
    return new ethers.WebSocketProvider(url);
  }

  public getProvider(type: 'main' | 'ws' = 'main'): ethers.Provider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not initialized`);
    }
    return provider;
  }

  public getConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Config not initialized');
    }
    return this.config;
  }

  public getProtocolConfig(): ProtocolAddresses {
    if (!this.config) {
      throw new Error('Config not initialized');
    }
    return this.config.protocols;
  }
}

export const configManager = ConfigManager.getInstance();