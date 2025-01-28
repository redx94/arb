export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  apiKey?: string;
  wsUrl?: string;
  explorer: string;
}

export interface ProtocolAddresses {
  aave: {
    lendingPool: string;
    dataProvider: string;
  };
  compound: {
    comptroller: string;
  };
  uniswap: {
    factoryV3: string;
    quoterV2: string;
  };
  curve: {
    registry: string;
  };
  balancer: {
    vault: string;
  };
}

export interface EnvironmentConfig {
  network: NetworkConfig;
  protocols: ProtocolAddresses;
  fallbackProviders: string[];
  maxRetries: number;
  retryDelay: number;
}