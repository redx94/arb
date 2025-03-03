export interface Trade {
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
}

export interface Balance {
  asset: string;
  dexAmount: number;
  cexAmount: number;
  pending: number;
}

export interface NetworkConditions {
  latency: number;
  gasPrice: number;
  blockConfirmationTime: number;
  networkCongestion: number;
}

export interface SimulationScenario {
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
}
