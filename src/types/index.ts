export type PriceData = {
  token: string;
  price: number;
  dex: number;
  cex: number;
  timestamp: number;
};

export type Trade = {
  id: string;
  type: 'BUY' | 'SELL';
  platform: string;
  amount: number;
  price: number;
  effectivePrice: number;
  profitLoss: number;
  priceImpact: number;
  gasCost: number;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
warnings: string[];
  executionTime?: number;
}

export type Balance = {
  asset: string;
  dexAmount: number;
  cexAmount: number;
  pending: number;
}

export type NetworkConditions = {
  latency: number;
  gasPrice: number;
  blockConfirmationTime: number;
  networkCongestion: number;
  networkLatency: number;
  blockTime: number;
}

export type SimulationScenario = {
  name: string;
  description: string;
  networkConditions: NetworkConditions;
  assets: string[];
  duration: number;
  riskThreshold: number;
}

export interface TradeDetails extends Trade {
  executedPrice: number;
  slippage: number;
  feeStructure: {
    makerFee: number;
    takerFee: number;
  };
  blockNumber?: number;
  flashLoan?: {
    protocol: string;
    amount: number;
    fee: number;
    profit: number;
  };
  routingPath?: string[];
  transaction?: {
    hash: string;
  };
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type Transaction = any;
export type Wallet = any;
export type TradeResult = any;
