export interface ArbitrageConfig {
  minProfitThreshold: number;
  maxExecutionTime: number;
  targetSuccessRate: number;
  maxSlippage: number;
  gasMultiplier: number;
  maxPathLength: number;
  minLiquidity: string;
  flashLoanEnabled: boolean;
}

export interface ArbitrageStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: string;
  averageExecutionTime: number;
  successRate: number;
  averageSlippage: number;
  totalGasSpent: string;
}

export interface ArbitrageEvent {
  type: 'opportunity' | 'execution' | 'error' | 'warning';
  timestamp: number;
  data: any;
}