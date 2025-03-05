export type PriceData = {
  token: string;
  price: number;
  dex: number;
  cex: number;
  timestamp: number;
  platform: string; // Added platform
  amount?: number; // Optional amount
};

export type Trade = {
  id: string;
  type: 'BUY' | 'SELL';
  platform: string;
  amount: bigint; // bigint
  price: bigint;  // bigint
  effectivePrice: bigint;
  profitLoss: bigint;
  priceImpact: bigint;
  gasCost: bigint;
  timestamp: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
warnings: string[];
  executionTime?: number;
}

export type Balance = {
  asset: string;
  dexAmount: bigint; // bigint
  cexAmount: bigint; // bigint
  pending: bigint;
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
  executedPrice: bigint;
  slippage: bigint;
  feeStructure: {
    makerFee: bigint;
    takerFee: bigint;
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

export interface FlashLoanParams {
  token: string;
  amount: string;
  expectedProfit: string;
  deadline: number;
  protocol: 'AAVE' | 'DYDX' | 'UNISWAP';
  maxSlippage?: number;
}
