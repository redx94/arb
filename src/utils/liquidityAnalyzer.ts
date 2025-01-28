import { ethers } from 'ethers';
import type { PriceData } from '../types';
import { Logger } from './monitoring';

const logger = Logger.getInstance();

export interface LiquidityAnalyzerConfig {
  wethAddress?: string;
  minLiquidity?: string;
  maxPriceImpact?: number;
  provider?: ethers.Provider;
}

export class LiquidityAnalyzer {
  private static instance: LiquidityAnalyzer;
  private readonly MIN_LIQUIDITY_DEPTH: bigint;
  private readonly MAX_PRICE_IMPACT: number;
  private readonly WETH_ADDRESS: string;
  private readonly provider?: ethers.Provider;

  private constructor(config: LiquidityAnalyzerConfig = {}) {
    // Initialize with safe defaults first
    this.WETH_ADDRESS = config.wethAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    this.MAX_PRICE_IMPACT = config.maxPriceImpact ?? 0.02; // 2% default
    this.provider = config.provider;

    // Safely initialize MIN_LIQUIDITY_DEPTH
    try {
      this.MIN_LIQUIDITY_DEPTH = config.minLiquidity 
        ? ethers.parseEther(config.minLiquidity)
        : ethers.parseEther('100'); // 100 ETH default
    } catch (error) {
      logger.error('Failed to initialize MIN_LIQUIDITY_DEPTH:', error);
      this.MIN_LIQUIDITY_DEPTH = 0n; // Safe fallback
    }
  }

  public static getInstance(config?: LiquidityAnalyzerConfig): LiquidityAnalyzer {
    if (!LiquidityAnalyzer.instance) {
      LiquidityAnalyzer.instance = new LiquidityAnalyzer(config);
    }
    return LiquidityAnalyzer.instance;
  }

  public async analyzeLiquidity(
    tokenAddress: string,
    amount: string | number,
    priceData: PriceData
  ) {
    try {
      // Input validation
      if (!tokenAddress || amount == null || !priceData) {
        throw new Error('Missing required parameters');
      }

      // Validate token address using ethers.js
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }

      // Normalize the address
      const normalizedToken = ethers.getAddress(tokenAddress);

      // Safely convert amount to bigint
      let amountBigInt: bigint;
      try {
        amountBigInt = typeof amount === 'string' 
          ? ethers.parseEther(amount)
          : ethers.parseEther(amount.toString());
      } catch (error) {
        logger.error('Failed to parse amount:', error);
        throw new Error('Invalid amount format');
      }

      // Get liquidity depth with validation
      const liquidityDepth = await this.getLiquidityDepth(normalizedToken);

      // Calculate price impact with validation
      const priceImpact = this.calculatePriceImpact(amountBigInt, liquidityDepth);
      if (typeof priceImpact !== 'number' || isNaN(priceImpact)) {
        throw new Error('Invalid price impact calculation');
      }

      return {
        safe: priceImpact <= this.MAX_PRICE_IMPACT,
        priceImpact,
        liquidityDepth: liquidityDepth.toString(),
        token: normalizedToken,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Liquidity analysis failed:', error);
      // Return safe fallback values
      return {
        safe: false,
        priceImpact: 1,
        liquidityDepth: '0',
        token: tokenAddress,
        timestamp: Date.now()
      };
    }
  }

  private async getLiquidityDepth(token: string): Promise<bigint> {
    try {
      // Validate token address using ethers.js
      if (!ethers.isAddress(token)) {
        throw new Error(`Invalid token address: ${token}`);
      }

      // Special handling for WETH
      if (token.toLowerCase() === this.WETH_ADDRESS.toLowerCase()) {
        return this.MIN_LIQUIDITY_DEPTH;
      }

      // For other tokens, fetch actual liquidity from provider
      if (this.provider) {
        try {
          // Get token contract
          const tokenContract = new ethers.Contract(
            token,
            ['function balanceOf(address) view returns (uint256)'],
            this.provider
          );

          // Get pool balance
          const balance = await tokenContract.balanceOf(this.WETH_ADDRESS);
          return balance > 0n ? balance : this.MIN_LIQUIDITY_DEPTH;
        } catch (error) {
          logger.error('Failed to fetch token liquidity:', error);
          return this.MIN_LIQUIDITY_DEPTH;
        }
      }

      return this.MIN_LIQUIDITY_DEPTH;
    } catch (error) {
      logger.error('Failed to get liquidity depth:', error);
      return 0n; // Safe fallback
    }
  }

  private calculatePriceImpact(
    amount: bigint,
    liquidityDepth: bigint
  ): number {
    try {
      // Validate inputs are bigint
      if (typeof amount !== 'bigint' || typeof liquidityDepth !== 'bigint') {
        throw new Error('Invalid input parameters - expected bigint');
      }

      // Handle zero or negative amounts
      if (amount <= 0n) {
        throw new Error('Amount must be positive');
      }

      // Handle zero liquidity case
      if (liquidityDepth === 0n) {
        return 1; // 100% impact
      }

      // Calculate impact: amount / (liquidity + amount)
      const denominator = liquidityDepth + amount;
      if (denominator === 0n) {
        return 1; // Avoid division by zero
      }

      // Use ethers formatting to handle decimal conversion
      const impactBigInt = (amount * ethers.parseEther('1')) / denominator;
      const impactNumber = Number(ethers.formatEther(impactBigInt));

      // Validate final result
      if (isNaN(impactNumber) || impactNumber < 0 || impactNumber > 1) {
        throw new Error('Invalid price impact calculation result');
      }

      return impactNumber;
    } catch (error) {
      logger.error('Price impact calculation failed:', error);
      return 1; // Return 100% impact on error as a safety measure
    }
  }
}