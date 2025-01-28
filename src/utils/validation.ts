import { ethers } from 'ethers';
import { Trade, Balance, PriceData } from '../types';
import { Logger } from './monitoring';

const logger = Logger.getInstance();

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateTradeInput = (trade: Trade): boolean => {
  try {
    if (!trade) {
      throw new ValidationError('Trade object is required');
    }

    if (typeof trade.amount !== 'bigint' || trade.amount <= 0n) {
      throw new ValidationError('Trade amount must be a positive bigint');
    }

    if (typeof trade.price !== 'number' || trade.price <= 0) {
      throw new ValidationError('Trade price must be a positive number');
    }

    if (!trade.type || !['BUY', 'SELL'].includes(trade.type)) {
      throw new ValidationError('Invalid trade type');
    }

    if (!trade.platform || !['DEX', 'CEX'].includes(trade.platform)) {
      throw new ValidationError('Invalid platform');
    }

    if (!trade.timestamp || trade.timestamp > Date.now()) {
      throw new ValidationError('Invalid timestamp');
    }

    return true;
  } catch (error) {
    logger.error('Trade validation failed:', error as Error, { trade });
    throw error;
  }
};

export const validateBalance = (balance: Balance): boolean => {
  try {
    if (!balance) {
      throw new ValidationError('Balance object is required');
    }

    if (typeof balance.dexAmount !== 'bigint' || balance.dexAmount < 0n) {
      throw new ValidationError('DEX balance must be a non-negative bigint');
    }

    if (typeof balance.cexAmount !== 'bigint' || balance.cexAmount < 0n) {
      throw new ValidationError('CEX balance must be a non-negative bigint');
    }

    if (!balance.asset || balance.asset.trim() === '') {
      throw new ValidationError('Asset name is required');
    }

    if (!balance.wallet || !ethers.isAddress(balance.wallet)) {
      throw new ValidationError('Invalid wallet address');
    }

    if (typeof balance.pending !== 'bigint' || balance.pending < 0n) {
      throw new ValidationError('Pending amount must be a non-negative bigint');
    }

    return true;
  } catch (error) {
    logger.error('Balance validation failed:', error as Error, { balance });
    throw error;
  }
};

export const validatePriceData = (priceData: PriceData): boolean => {
  try {
    if (!priceData) {
      throw new ValidationError('Price data object is required');
    }

    if (typeof priceData.dex !== 'number' || priceData.dex <= 0) {
      throw new ValidationError('Invalid DEX price');
    }

    if (typeof priceData.cex !== 'number' || priceData.cex <= 0) {
      throw new ValidationError('Invalid CEX price');
    }

    if (!priceData.timestamp || priceData.timestamp > Date.now()) {
      throw new ValidationError('Invalid timestamp');
    }

    // Check for reasonable price difference
    const priceDiff = Math.abs(priceData.dex - priceData.cex) / Math.min(priceData.dex, priceData.cex);
    if (priceDiff > 0.1) { // 10% difference threshold
      throw new ValidationError('Suspicious price difference detected');
    }

    return true;
  } catch (error) {
    logger.error('Price data validation failed:', error as Error, { priceData });
    throw error;
  }
};