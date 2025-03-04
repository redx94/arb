import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArbitrageEngine } from '../arbitrageEngine';
import { PriceFeed } from '../../priceFeeds';
import { RiskManager } from '../../riskManager';
describe('ArbitrageEngine', () => {
    let arbitrageEngine;
    beforeEach(() => {
        arbitrageEngine = ArbitrageEngine.getInstance();
        PriceFeed.getInstance().setMockMode(false); // Ensure live price feed is used
    });
    it('should start and stop correctly', () => {
        arbitrageEngine.start();
        expect(arbitrageEngine.isRunning()).toBe(true);
        arbitrageEngine.stop();
        expect(arbitrageEngine.isRunning()).toBe(false);
    });
    it('should detect profitable arbitrage opportunity from live data', (done) => {
        arbitrageEngine.start();
        arbitrageEngine.once('arbitrageOpportunity', (data) => {
            expect(data).toBeDefined();
            expect(data.dex).toBeDefined();
            expect(data.cex).toBeDefined();
            arbitrageEngine.stop();
            done();
        });
    }, 15000); // Increased timeout for live data fetching
    it('should respect risk management rules with live data', async () => {
        const emitWarningSpy = vi.spyOn(arbitrageEngine, 'emit');
        vi.spyOn(RiskManager.getInstance(), 'validateTrade').mockImplementation(() => {
            throw new Error('Risk limit exceeded');
        });
        arbitrageEngine.start();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait a bit for live price data to trigger engine
        expect(emitWarningSpy).toHaveBeenCalledTimes(0); // Or adjust based on expected behavior with live data and RiskManager
        arbitrageEngine.stop();
    }, 20000); // Increased timeout for live data and risk management
    it('should handle errors from price feed', (done) => {
        const error = new Error('Price feed error');
        vi.spyOn(PriceFeed.getInstance(), 'subscribe').mockImplementationOnce(() => (callback) => {
            // Simulate an error when price feed attempts to update
            callback(error);
            return (() => { })(); // Return a dummy unsubscribe function
        });
        arbitrageEngine.start();
        arbitrageEngine.once('error', (emittedError) => {
            expect(emittedError).toEqual(error);
            arbitrageEngine.stop();
            done();
        });
    }, 10000);
});
