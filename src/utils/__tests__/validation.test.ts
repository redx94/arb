import { describe, it, expect } from 'vitest';
import { validateTradeInput, validateBalance, validatePriceData, ValidationError } from '../validation';
import { Trade, Balance, PriceData } from '../../types';

describe('Validation Utils', () => {
  describe('validateTradeInput', () => {
    it('should validate correct trade input', () => {
      const trade: Trade = {
        id: '1',
        type: 'BUY',
        platform: 'DEX',
        amount: 1,
        price: 1000,
        timestamp: Date.now(),
        status: 'PENDING'
      };
      expect(() => validateTradeInput(trade)).not.toThrow();
    });

    it('should throw on invalid amount', () => {
      const trade: Trade = {
        id: '1',
        type: 'BUY',
        platform: 'DEX',
        amount: 0,
        price: 1000,
        timestamp: Date.now(),
        status: 'PENDING'
      };
      expect(() => validateTradeInput(trade)).toThrow(ValidationError);
    });
  });

  describe('validateBalance', () => {
    it('should validate correct balance', () => {
      const balance: Balance = {
        asset: 'ETH',
        dexAmount: 1,
        cexAmount: 1,
        wallet: '0x1234567890123456789012345678901234567890',
        pending: 0
      };
      expect(() => validateBalance(balance)).not.toThrow();
    });

    it('should throw on negative amounts', () => {
      const balance: Balance = {
        asset: 'ETH',
        dexAmount: -1,
        cexAmount: 1,
        wallet: '0x1234567890123456789012345678901234567890',
        pending: 0
      };
      expect(() => validateBalance(balance)).toThrow(ValidationError);
    });
  });

  describe('validatePriceData', () => {
    it('should validate correct price data', () => {
      const priceData: PriceData = {
        dex: 1000,
        cex: 1000,
        timestamp: Date.now()
      };
      expect(() => validatePriceData(priceData)).not.toThrow();
    });

    it('should throw on invalid prices', () => {
      const priceData: PriceData = {
        dex: 0,
        cex: 1000,
        timestamp: Date.now()
      };
      expect(() => validatePriceData(priceData)).toThrow(ValidationError);
    });
  });
});