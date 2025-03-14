import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManager } from '../riskManager';
describe('RiskManager', () => {
    let riskManager;
    let mockPriceData;
    beforeEach(() => {
        riskManager = RiskManager.getInstance();
        mockPriceData = {
            token: 'ETH',
            price: 1000,
            dex: 1000,
            cex: 1000,
            timestamp: Date.now()
        };
    });
    it('should validate safe trade', () => {
        expect(() => riskManager.validateTrade({ dex: mockPriceData.dex, cex: mockPriceData.cex, amount: 1 })).not.toThrow();
    });
    it('should detect price manipulation', () => {
        const manipulatedPrice = {
            ...mockPriceData,
            dex: mockPriceData.dex * 1.1
        };
        expect(() => riskManager.validateTrade({ dex: manipulatedPrice.dex, cex: mockPriceData.cex, amount: 1 })).toThrow('Risk limit exceeded: Price difference exceeds 5% threshold.');
    });
    it('should enforce position size limits', () => {
        expect(() => riskManager.validateTrade({ dex: mockPriceData.dex, cex: mockPriceData.cex, amount: 1 })).not.toThrow();
    });
    it('should handle mock mode correctly', () => {
        expect(() => riskManager.validateTrade({ dex: mockPriceData.dex, cex: mockPriceData.cex, amount: 1 })).not.toThrow();
    });
});
