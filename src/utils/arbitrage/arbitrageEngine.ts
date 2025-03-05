import { EventEmitter } from 'events';
import type { PriceData, TradeDetails, FlashLoanParams } from '../../types/index.js';
import { PriceFeed } from '../priceFeeds.js';
import { RiskManager } from '../riskManager.js';
import { Logger } from '../monitoring.js';
import { tradeExecutor } from '../tradeExecutor.js';
import { GasAwareFlashLoanProvider } from '../gas/GasAwareFlashLoan.js';

interface PriceDataWithAmount extends PriceData {
  amount: number;
}

export class ArbitrageEngine extends EventEmitter {
  private static instance: ArbitrageEngine;
  private running = false;
  private logger = Logger.getInstance();
  private unsubscribePriceFeed: (() => void) | null = null;
  private gasAwareFlashLoanProvider = new GasAwareFlashLoanProvider();

  private constructor() {
    super();
  }

  public static getInstance(): ArbitrageEngine {
    if (!ArbitrageEngine.instance) {
      ArbitrageEngine.instance = new ArbitrageEngine();
    }
    return ArbitrageEngine.instance;
  }

  public start() {
    if (this.running) {
      this.logger.info('ArbitrageEngine already running.');
      return;
    }
    this.logger.info('ArbitrageEngine starting...'); // Added log
    this.logger.info(`PROFIT_THRESHOLD: ${process.env.PROFIT_THRESHOLD}, TRADE_AMOUNT: ${process.env.TRADE_AMOUNT}, TOKENS: ${process.env.TOKENS}, PROTOCOLS: ${process.env.PROTOCOLS}`); // Log env vars
    this.running = true;
    this.emit('started');
    this.logger.info('ArbitrageEngine started.'); // Added log
    this.unsubscribePriceFeed = PriceFeed.getInstance().subscribe(this.handlePrice);
    if (this.unsubscribePriceFeed !== null) {
      this.logger.info('Subscribed to PriceFeed.'); // Added log
    } else {
      this.logger.error('Failed to subscribe to PriceFeed.'); // Added log
    }
  }

  public stop() {
    if (!this.running) return;
    this.running = false;
    this.emit('stopped');
    if (this.unsubscribePriceFeed) {
      this.unsubscribePriceFeed();
      this.unsubscribePriceFeed = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  private handlePrice = async (data: PriceData) => {
    console.log('handlePrice: start'); // Added console log
    this.logger.info('Handling price update...'); // Added log
    this.logger.info(`Received price data: ${JSON.stringify(data)}`); // Log price data
    try {
      const profitThreshold = parseFloat(process.env.PROFIT_THRESHOLD || '1'); // 1% threshold

      // Fetch platform-specific prices
      const dexPriceData = await PriceFeed.getInstance().getCurrentPrice('dex');
      this.logger.info(`DEX price data: ${JSON.stringify(dexPriceData)}`); // Log DEX price data
      const cexPriceData = await PriceFeed.getInstance().getCurrentPrice('cex');
      this.logger.info(`CEX price data: ${JSON.stringify(cexPriceData)}`); // Log CEX price data

      if (!dexPriceData || !cexPriceData) {
        this.logger.error('Failed to fetch dex or cex price data.');
        this.logger.error(`dexPriceData: ${JSON.stringify(dexPriceData)}, cexPriceData: ${JSON.stringify(cexPriceData)}`);
        return;
      }

      const diff = Math.abs(cexPriceData.price - dexPriceData.price) / Math.min(dexPriceData.price, cexPriceData.price) * 100;
      this.logger.info(`Price difference: dex=${dexPriceData.price}, cex=${cexPriceData.price}, diff=${diff}`);
      console.log(`dexPriceData.price: ${dexPriceData.price}, cexPriceData.price: ${cexPriceData.price}, diff: ${diff}`);
      if (diff >= profitThreshold) {
        console.log(`Arbitrage opportunity detected: dex=${dexPriceData.price}, cex=${cexPriceData.price}, diff=${diff}`);
        this.logger.info(`Arbitrage opportunity detected: dex=${dexPriceData.price}, cex=${cexPriceData.price}`);
        this.emit('arbitrageOpportunity', { dex: Number(dexPriceData.dex), cex: Number(cexPriceData.cex) }); // Emit price data
        const defaultTradeAmount = process.env.TRADE_AMOUNT || '1';
        const tradeAmount = data.amount !== undefined ? String(data.amount) : defaultTradeAmount; // Use amount from PriceData or default to defaultTradeAmount
        // Check risk management
        const dataWithAmount: PriceDataWithAmount = { ...data, amount: parseFloat(tradeAmount) };
        this.logger.info(`Validating trade: dex=${dexPriceData.dex}, cex=${cexPriceData.cex}, amount=${tradeAmount}`);
        try {
          await RiskManager.getInstance().validateTrade({ dex: Number(Number(dexPriceData.dex)), cex: Number(Number(cexPriceData.cex)), amount: parseFloat(tradeAmount) });
          this.logger.info('Trade validated successfully.');
        } catch (riskError: any) {
          this.logger.error(`Trade validation failed: ${riskError}`, riskError instanceof Error ? riskError : new Error(String(riskError)));
          return;
        }

        // Determine trade direction
        const buyPlatform = dexPriceData.price < cexPriceData.price ? 'dex' : 'cex';
        const sellPlatform = dexPriceData.price < cexPriceData.price ? 'cex' : 'dex';
        const tradeType = dexPriceData.price < cexPriceData.price ? 'BUY' : 'SELL';
        const priceNumber = dexPriceData.price < cexPriceData.price ? dexPriceData.price : cexPriceData.price;
        const priceBigInt = BigInt(priceNumber);

        const tokens = (process.env.TOKENS || 'ETH,BTC').split(','); // Replace with actual tokens
        const protocols = (process.env.PROTOCOLS || 'AAVE').split(','); // Replace with actual protocols

        try {
          for (const token of tokens) {
            for (const protocol of protocols) {
              // Flash loan parameters
              const flashLoanParams: FlashLoanParams = {
                token: token, // Assuming the first token is the flash loan token
                amount: tradeAmount,
                expectedProfit: String(diff), // Using the price difference as the expected profit
                deadline: Date.now() + 60000, // 1 minute deadline
                protocol: protocol as 'AAVE' | 'DYDX' | 'UNISWAP',
                maxSlippage: 0,
              };

              // Execute flash loan
              this.logger.info(`Executing flash loan: token=${token}, amount=${tradeAmount}, protocol=${protocol}`);
              let txHash;
              try {
                txHash = await this.gasAwareFlashLoanProvider.executeFlashLoan(flashLoanParams);
                this.logger.info(`Flash loan executed successfully: txHash=${txHash}`);
              } catch (flashLoanError: any) {
                this.logger.error(`Flash loan execution failed for token=${token}, protocol=${protocol}: ${flashLoanError}`, flashLoanError instanceof Error ? flashLoanError : new Error(String(flashLoanError)));
                this.emit('error', flashLoanError);
                continue; // Skip to the next token/protocol combination
              }

              this.logger.info(`Executing trade: tradeType=${tradeType}, buyPlatform=${buyPlatform}, amount=${tradeAmount}, token=${token}, protocol=${protocol}`);
              let tradeResult;
              try {
                tradeResult = await tradeExecutor.executeTrade(tradeType, buyPlatform, tradeAmount, priceBigInt, token, protocol as 'AAVE' | 'DYDX' | 'UNISWAP');

                if (tradeResult.success) {
                  this.logger.info(`Trade executed successfully: id=${tradeResult.trade?.id}, token=${token}, protocol=${protocol}`);
                  this.emit('tradeExecuted', tradeResult.trade);
                } else {
                  this.logger.error(`Trade execution failed for token=${token}, protocol=${protocol}: ${tradeResult.error}`);
                  this.emit('error', tradeResult.error);
                }
              } catch (tradeError: any) {
                this.logger.error(`Trade execution failed for token=${token}, protocol=${protocol}: ${tradeError}`, tradeError instanceof Error ? tradeError : new Error(String(tradeError)));
                this.emit('error', tradeError);
              }
            }
          }
        } catch (flashLoanError: any) {
          this.logger.error(`Flash loan execution failed: ${flashLoanError}`, flashLoanError instanceof Error ? flashLoanError : new Error(String(flashLoanError)));
          this.emit('error', flashLoanError);
        }
      }
    } catch (error: any) {
      this.logger.error('Error in handlePrice:', error instanceof Error ? error : new Error(String(error)));
      this.emit('error', error);
    }
  };
}
