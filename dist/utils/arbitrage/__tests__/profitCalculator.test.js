import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfitCalculator } from '../profitCalculator';
import { PriceFeed } from '../../priceFeeds';
describe('ProfitCalculator', () => {
    let profitCalculator;
    let mockPriceData;
    let mockPriceFeed;
    beforeEach(() => {
        mockPriceData = {
            token: 'ETH',
            price: 1000,
            dex: 1000,
            cex: 1020,
            timestamp: Date.now()
        };
        mockPriceFeed = {
            getCurrentPrice: vi.fn().mockResolvedValue(mockPriceData),
            getHistoricalPrice: vi.fn().mockResolvedValue([[Date.now(), 1000], [Date.now() + 86400000, 1020]]), // Mock historical prices
        };
        vi.spyOn(PriceFeed, 'getInstance').mockReturnValue(mockPriceFeed);
        profitCalculator = ProfitCalculator.getInstance();
    });
    it('should calculate potential profit correctly', async () => {
        const buyPrice = 1000;
        const sellPrice = 1020;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.profit).toBeGreaterThanOrEqual(0);
    });
    it('should return isViable as false when profit is below threshold', async () => {
        const buyPrice = 1000;
        const sellPrice = 1000.001;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.isViable).toBe(false);
    });
    it('should handle zero values correctly', async () => {
        mockPriceFeed.getCurrentPrice.mockResolvedValue({
            token: 'ETH',
            price: 0,
            dex: 0,
            cex: 0,
            timestamp: Date.now()
        });
        const buyPrice = 0;
        const sellPrice = 0;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.profit).toBeLessThanOrEqual(0);
    });
    it('should handle unprofitable scenarios', async () => {
        mockPriceFeed.getCurrentPrice.mockResolvedValue({
            token: 'ETH',
            price: 1000,
            dex: 1020,
            cex: 1000,
            timestamp: Date.now()
        });
        const buyPrice = 1020;
        const sellPrice = 1000;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.profit).toBeLessThanOrEqual(0);
    });
    it('should handle large numbers correctly', async () => {
        mockPriceFeed.getCurrentPrice.mockResolvedValue({
            token: 'ETH',
            price: 100000,
            dex: 50000,
            cex: 50500,
            timestamp: Date.now()
        });
        const buyPrice = 50000;
        const sellPrice = 50500;
        const amount = 10;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.profit).toBeGreaterThanOrEqual(0);
    });
    it('should handle different amounts correctly', async () => {
        mockPriceFeed.getCurrentPrice.mockResolvedValue({
            token: 'ETH',
            price: 1000,
            dex: 1000,
            cex: 1020,
            timestamp: Date.now()
        });
        const buyPrice = 1000;
        const sellPrice = 1020;
        const amount = 0.5;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.profit).toBeGreaterThanOrEqual(0);
    });
    it('should calculate gas cost correctly', async () => {
        const buyPrice = 1000;
        const sellPrice = 1020;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.details.breakdown.gasCost).toBeGreaterThan(0);
    });
    it('should calculate slippage cost correctly', async () => {
        const buyPrice = 1000;
        const sellPrice = 1020;
        const amount = 1;
        const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(result.details.breakdown.slippageCost).toBeGreaterThan(0);
    });
    it('should use historical price data in calculation', async () => {
        const buyPrice = 1000;
        const sellPrice = 1020;
        const amount = 1;
        await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount);
        expect(mockPriceFeed.getHistoricalPrice).toHaveBeenCalled();
    });
});
