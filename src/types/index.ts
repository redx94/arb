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
