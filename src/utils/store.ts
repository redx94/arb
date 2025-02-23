import { create } from 'zustand';
import { Trade, PriceData, Balance } from '../types';
import { Logger } from './monitoring';

const logger = Logger.getInstance();

interface TradeStore {
  trades: Trade[];
  priceHistory: PriceData[];
  balances: Balance[];
  addTrade: (trade: Trade) => void;
  removeTrade: (id: string) => void;
  updatePriceHistory: (price: PriceData) => void;
  updateBalances: (balances: Balance[]) => void;
}

export const useTradeStore = create<TradeStore>((set) => ({
  trades: [],
  priceHistory: [],
  balances: [],

  addTrade: (trade) => {
    logger.info('Adding trade', { trade });
    set((state) => ({
      trades: [...state.trades, trade]
    }));
  },

  removeTrade: (id) => {
    logger.info('Removing trade', { id });
    set((state) => ({
      trades: state.trades.filter(t => t.id !== id)
    }));
  },

  updatePriceHistory: (price) => {
    set((state) => ({
      priceHistory: [...state.priceHistory.slice(-99), price]
    }));
  },

  updateBalances: (balances) => {
    logger.info('Updating balances', { balances });
    set({ balances });
  }
}));