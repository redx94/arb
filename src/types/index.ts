export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  platform: 'DEX' | 'CEX';
  amount: bigint;
  price: bigint;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  slippage?: number;
  gasCost?: bigint;
  transaction?: Transaction;
  executionTime?: number;
  routingPath?: string[];
}

export type NetworkConditions = {
  gasPrice: number;
  networkLatency: number;
  blockTime: number;
  confirmationBlocks: number;
};

export type SimulationScenario = {
  name: string;
  networkConditions: NetworkConditions;
  profitThreshold: number;
  volatility: number;
  dexMultiplier: number;
};

export interface RiskLevel {
  level: string;
  color: string;
  description: string;
}

export interface TradeResult {
  success: boolean;
  trade?: Trade;
  error?: string;
}

export interface Balance {
  asset: string;
  dexAmount: bigint;
  cexAmount: bigint;
  wallet: string;
  pending: bigint;
}

export interface PriceData {
  dex: number;
  cex: number;
  timestamp: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data?: string;
  chainId: number;
}

export interface Wallet {
  address: string;
  privateKey: string;
  chainId: number;
  network: string;
}

export interface TradeDetails {
  id: string;
  type: 'BUY' | 'SELL';
  platform: 'DEX' | 'CEX';
  amount: bigint;
  price: bigint;
  effectivePrice: bigint;
  profitLoss: bigint;
  gasCost?: bigint;
  slippage?: number;
  priceImpact: number;
  executionTime?: number;
  blockNumber?: number;
  flashLoan?: {
    protocol: string;
    amount: bigint;
    fee: bigint;
    profit: bigint;
  };
  routingPath?: string[];
  warnings?: string[];
  transaction?: Transaction;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface ArbitrageOpportunity {
  id: string;
  dex: number;
  cex: number;
  amount: bigint;
  priceDiff: bigint;
  profit: bigint;
  timestamp: number;
}
