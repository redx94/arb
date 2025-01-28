import { Trade, Balance, PriceData } from '../types';
import { EventEmitter } from 'events';

export class RiskManager {
  private static instance: RiskManager;
  private maxDrawdown: number = 0.2;
  private positionSizeLimit: number = 0.5;
  private stopLossPercentage: number = 0.05;
  private mockMode: boolean = true;
  private readonly eventEmitter = new EventEmitter();
  private priceHistory: PriceData[] = [];
  private readonly PRICE_HISTORY_LIMIT = 1000;
  private readonly MANIPULATION_THRESHOLD = 0.05; // 5% sudden price change
  private readonly CIRCUIT_BREAKER_THRESHOLD = 0.1; // 10% market move
  
  public static getInstance(): RiskManager {
    if (!RiskManager.instance) {
      RiskManager.instance = new RiskManager();
    }
    return RiskManager.instance;
  }

  public setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }

  public validateTrade(trade: Trade, balance: Balance, priceData: PriceData) {
    if (this.mockMode) {
      return true;
    }

    this.updatePriceHistory(priceData);

    // Check for price manipulation
    if (this.detectPriceManipulation(priceData)) {
      throw new Error('Potential price manipulation detected');
    }

    // Check circuit breakers
    if (this.isCircuitBreakerTriggered(priceData)) {
      throw new Error('Circuit breaker triggered - trading paused');
    }

    const totalPortfolioValue = this.calculatePortfolioValue(balance, priceData);
    const tradeValue = trade.amount * trade.price;
    
    // Enhanced position size check with dynamic limits
    const dynamicPositionLimit = this.calculateDynamicPositionLimit(totalPortfolioValue);
    if (tradeValue / totalPortfolioValue > dynamicPositionLimit) {
      throw new Error('Trade size exceeds dynamic position limit');
    }

    // Enhanced stop loss with market volatility consideration
    const volatilityAdjustedStopLoss = this.calculateVolatilityAdjustedStopLoss(priceData);
    const potentialLoss = tradeValue * volatilityAdjustedStopLoss;
    const availableBalance = balance.dexAmount * priceData.dex;

    if (!this.mockMode && potentialLoss > availableBalance * 2) {
      throw new Error('Insufficient balance for volatility-adjusted stop loss');
    }

    // Check maximum drawdown with trailing high water mark
    const currentDrawdown = this.calculateCurrentDrawdown(balance, priceData);
    if (!this.mockMode && currentDrawdown > this.maxDrawdown) {
      throw new Error('Maximum drawdown limit reached');
    }

    return true;
  }

  private updatePriceHistory(priceData: PriceData) {
    this.priceHistory.push(priceData);
    if (this.priceHistory.length > this.PRICE_HISTORY_LIMIT) {
      this.priceHistory.shift();
    }
  }

  private detectPriceManipulation(currentPrice: PriceData): boolean {
    if (this.priceHistory.length < 2) return false;

    const previousPrice = this.priceHistory[this.priceHistory.length - 2];
    const dexPriceChange = Math.abs(currentPrice.dex - previousPrice.dex) / previousPrice.dex;
    const cexPriceChange = Math.abs(currentPrice.cex - previousPrice.cex) / previousPrice.cex;

    return dexPriceChange > this.MANIPULATION_THRESHOLD || 
           cexPriceChange > this.MANIPULATION_THRESHOLD;
  }

  private isCircuitBreakerTriggered(currentPrice: PriceData): boolean {
    if (this.priceHistory.length < 10) return false;

    const basePrice = this.priceHistory[this.priceHistory.length - 10];
    const dexPriceChange = Math.abs(currentPrice.dex - basePrice.dex) / basePrice.dex;
    const cexPriceChange = Math.abs(currentPrice.cex - basePrice.cex) / basePrice.cex;

    return dexPriceChange > this.CIRCUIT_BREAKER_THRESHOLD || 
           cexPriceChange > this.CIRCUIT_BREAKER_THRESHOLD;
  }

  private calculateDynamicPositionLimit(portfolioValue: number): number {
    // Adjust position limit based on portfolio size
    const baseLimit = this.positionSizeLimit;
    if (portfolioValue < 10000) {
      return baseLimit * 0.5; // More conservative for smaller portfolios
    } else if (portfolioValue > 100000) {
      return baseLimit * 0.8; // More flexible for larger portfolios
    }
    return baseLimit;
  }

  private calculateVolatilityAdjustedStopLoss(priceData: PriceData): number {
    const volatility = this.calculateHistoricalVolatility();
    return this.stopLossPercentage * (1 + volatility);
  }

  private calculateHistoricalVolatility(): number {
    if (this.priceHistory.length < 2) return 0;

    const returns = this.priceHistory.slice(1).map((price, index) => {
      const previousPrice = this.priceHistory[index];
      return (price.dex - previousPrice.dex) / previousPrice.dex;
    });

    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  // ... (rest of the existing methods)

  public on(event: string, callback: (...args: any[]) => void) {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    this.eventEmitter.off(event, callback);
  }
}