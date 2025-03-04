import { create } from 'zustand';
import { Logger } from './monitoring';
const logger = Logger.getInstance();
export const useTradeStore = create((set) => ({
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
