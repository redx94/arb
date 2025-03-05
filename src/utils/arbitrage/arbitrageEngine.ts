import { EventEmitter } from 'events';
import type { PriceData, TradeDetails, FlashLoanParams } from '../../types/index.js';
import { PriceFeed } from '../priceFeeds.js';
import { RiskManager } from '../riskManager.js';
import { Logger } from '../monitoring.js';
import { tradeExecutor } from '../tradeExecutor.js';
import { FlashLoanProvider } from '../flashLoanProvider.js';

interface PriceDataWithAmount extends PriceData {
  amount: number;
}

export class ArbitrageEngine extends EventEmitter {
  private static instance: ArbitrageEngine;
  private running = false;
  private logger = Logger.getInstance();
  private unsubscribePriceFeed: (() => void) | null = null;
  private flashLoanProvider = new FlashLoanProvider();

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
    this.logger.info('ArbitrageEngine starting...');
    this.logger.info('PROFIT_THRESHOLD: ' + String(process.env.PROFIT_THRESHOLD) + ', TRADE_AMOUNT: ' + String(process.env.TRADE_AMOUNT) + ', TOKENS: ' + String(process.env.TOKENS) + ', PROTOCOLS: ' + String(process.env.PROTOCOLS));
    this.running = true;
    this.emit('started');
    this.logger.info('ArbitrageEngine started.');
    this.unsubscribePriceFeed = PriceFeed.getInstance().subscribe(this.handlePrice);
    if (this.unsubscribePriceFeed !== null) {
      this.logger.info('Subscribed to PriceFeed.');
    } else {
      this.logger.error('Failed to subscribe to PriceFeed.');
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

  public reset() {
    this.stop();
    if (this.unsubscribePriceFeed) {
      this.unsubscribePriceFeed();
      this.unsubscribePriceFeed = null;
    }
    this.flashLoanProvider = new FlashLoanProvider();
  }

  private handlePrice = async (data: PriceData) => {
    console.log('handlePrice: start');
    this.logger.info('Handling price update...');
    this.logger.info('Received price data: ' + JSON.stringify(data));
    try {
      const profitThreshold = parseFloat(process.env.PROFIT_THRESHOLD || '1');

      const dexPriceData = await PriceFeed.getInstance().getCurrentPrice('dex');
      this.logger.info('DEX price data: ' + JSON.stringify(dexPriceData));
      const cexPriceData = await PriceFeed.getInstance().getCurrentPrice('cex');
      this.logger.info('CEX price data: ' + JSON.stringify(cexPriceData));

      if (!dexPriceData || !cexPriceData) {
        this.logger.error('Failed to fetch dex or cex price data.');
        this.logger.error('dexPriceData: ' + JSON.stringify(dexPriceData) + ', cexPriceData: ' + JSON.stringify(cexPriceData));
        return;
      }

      const diff = Math.abs(cexPriceData.price - dexPriceData.price) / Math.min(dexPriceData.price, cexPriceData.price) * 100;
      this.logger.info('Price difference: dex=' + String(dexPriceData.price) + ', cex=' + String(cexPriceData.price) + ', diff=' + String(diff));
      console.log('dexPriceData.price: ' + String(dexPriceData.price) + ', cexPriceData.price: ' + String(cexPriceData.price) + ', diff: ' + String(diff));
      if (diff >= profitThreshold) {
        console.log('Arbitrage opportunity detected: dex=' + String(dexPriceData.price) + ', cex=' + String(cexPriceData.price) + ', diff=' + String(diff));
        this.logger.info('Arbitrage opportunity detected: dex=' + String(dexPriceData.price) + ', cex=' + String(cexPriceData.price));
        this.emit('arbitrageOpportunity', { dex: Number(dexPriceData.dex), cex: Number(cexPriceData.cex) });
        const defaultTradeAmount = process.env.TRADE_AMOUNT || '1';
        const tradeAmount = data.amount !== undefined ? String(data.amount) : defaultTradeAmount;
        const dataWithAmount: PriceDataWithAmount = { ...data, amount: parseFloat(tradeAmount) };
        this.logger.info('Validating trade: dex=' + String(dexPriceData.dex) + ', cex=' + String(dexPriceData.cex) + ', amount=' + String(tradeAmount));
        try {
          await RiskManager.getInstance().validateTrade({ dex: Number(Number(dexPriceData.dex)), cex: Number(Number(cexPriceData.cex)), amount: parseFloat(tradeAmount) });
          this.logger.info('Trade validated successfully.');
        } catch (riskError: any) {
          this.logger.error('Trade validation failed: ' + String(riskError));
          return;
        }

        const buyPlatform = dexPriceData.price < cexPriceData.price ? 'dex' : 'cex';
        const sellPlatform = dexPriceData.price < cexPriceData.price ? 'cex' : 'dex';
        const tradeType = dexPriceData.price < cexPriceData.price ? 'BUY' : 'SELL';
        const priceNumber = dexPriceData.price < cexPriceData.price ? dexPriceData.price : cexPriceData.price;
        const priceBigInt = BigInt(priceNumber);

        const tokens = (process.env.TOKENS || 'ETH,BTC').split(',');
        const protocols = (process.env.PROTOCOLS || 'AAVE').split(',');

        try {
          for (const token of tokens) {
            for (const protocol of protocols) {
              const flashLoanParams: FlashLoanParams = {
                token: token,
                amount: tradeAmount,
                expectedProfit: String(diff),
                deadline: Date.now() + 60000,
                protocol: protocol as 'AAVE' | 'DYDX' | 'UNISWAP',
                maxSlippage: 0,
              };

              this.logger.info('Executing flash loan: token=' + token + ', amount=' + tradeAmount + ', protocol=' + protocol);
              let txHash;
              try {
                txHash = await this.flashLoanProvider.executeFlashLoan(flashLoanParams);
                this.logger.info('Flash loan executed successfully: txHash=' + String(txHash));
              } catch (flashLoanError: any) {
                this.logger.error('Flash loan execution failed for token=' + token + ', protocol=' + protocol + ': ' + String(flashLoanError));
                this.emit('error', flashLoanError);
                continue;
              }

              this.logger.info('Executing trade: tradeType=' + tradeType + ', buyPlatform=' + buyPlatform + ', amount=' + tradeAmount + ', token=' + token + ', protocol=' + protocol);
              let tradeResult;
              let tradeError: any;
              try {
                tradeResult = await tradeExecutor.executeTrade(tradeType, buyPlatform, tradeAmount, priceBigInt, token, protocol as 'AAVE' | 'DYDX' | 'UNISWAP');

                if (tradeResult.success) {
                  this.logger.info('Trade executed successfully: id=' + String(tradeResult.trade?.id) + ', token=' + token + ', protocol=' + protocol);
                  this.emit('tradeExecuted', tradeResult.trade);
                } else {
                  this.logger.error('Trade execution failed for token=' + token + ', protocol=' + protocol + ': ' + String(tradeResult.error));
                  this.emit('error', tradeError);
                }
              } catch (e: any) {
                tradeError = e;
                this.logger.error('Trade execution failed for token=' + token + ', protocol=' + protocol + ': ' + String(tradeError));
                this.emit('error', tradeError);
              }
            }
          }
        } catch (flashLoanError: any) {
          this.logger.error('Flash loan execution failed: ' + String(flashLoanError));
          this.emit('error', flashLoanError);
        }
      }
    } catch (error: any) {
      this.logger.error('Error in handlePrice: ' + String(error));
      this.emit('error', error);
    }
  };
}
