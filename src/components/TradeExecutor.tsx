import React, { useState } from 'react';
import { ArrowRightLeft, AlertCircle, Wallet, TrendingUp, BarChart3 } from 'lucide-react';
import { tradeExecutor } from '../utils/tradeExecutor';
import { generateMarketDepth, calculateSlippage } from '../utils/mockData';
import type { PriceData, Trade, Balance } from '../types';
import { TradeDetails } from './TradeDetails';

interface Props {
  priceData?: PriceData;
  onTradeComplete: (trade: Trade) => void;
}

export const TradeExecutor: React.FC<Props> = ({ priceData, onTradeComplete }) => {
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [balances, setBalances] = useState<Balance[]>(tradeExecutor.getBalances());
  const [estimatedSlippage, setEstimatedSlippage] = useState<number>(0);
  const [tradeHistory, setTradeHistory] = useState<TradeDetails[]>([]);

  const calculateEstimatedSlippage = (orderSize: number) => {
    if (!priceData) return;
    const dexMarketDepth = generateMarketDepth(priceData.dex);
    const { slippage } = calculateSlippage(orderSize, dexMarketDepth);
    setEstimatedSlippage(slippage);
  };

  const executeArbitrage = async () => {
    if (!priceData) return;

    setLoading(true);
    setError('');

    const startTime = performance.now();

    try {
      const isDexCheaper = priceData.dex < priceData.cex;
      const priceDiff = Math.abs(priceData.dex - priceData.cex);
      const profitPotential = (priceDiff / Math.min(priceData.dex, priceData.cex)) * 100;

      if (profitPotential < 1) {
        throw new Error('Insufficient price difference for profitable arbitrage');
      }

      const buyResult = await tradeExecutor.executeTrade(
        'BUY',
        isDexCheaper ? 'DEX' : 'CEX',
        amount,
        isDexCheaper ? priceData.dex : priceData.cex
      );

      if (!buyResult.success) {
        throw new Error(buyResult.error);
      }

      const sellResult = await tradeExecutor.executeTrade(
        'SELL',
        isDexCheaper ? 'CEX' : 'DEX',
        amount,
        isDexCheaper ? priceData.cex : priceData.dex
      );

      if (!sellResult.success) {
        throw new Error(sellResult.error);
      }

      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      if (buyResult.trade && sellResult.trade) {
        const buyTradeDetails: TradeDetails = {
          ...buyResult.trade,
          profitLoss: -buyResult.trade.amount * buyResult.trade.price,
          effectivePrice: buyResult.trade.price * (1 + (buyResult.trade.slippage || 0)),
          priceImpact: buyResult.trade.slippage || 0,
          executionTime,
          warnings: []
        };

        const sellTradeDetails: TradeDetails = {
          ...sellResult.trade,
          profitLoss: sellResult.trade.amount * sellResult.trade.price,
          effectivePrice: sellResult.trade.price * (1 - (sellResult.trade.slippage || 0)),
          priceImpact: sellResult.trade.slippage || 0,
          executionTime,
          warnings: []
        };

        setTradeHistory(prev => [...prev, buyTradeDetails, sellTradeDetails]);
        onTradeComplete(buyTradeDetails);
        onTradeComplete(sellTradeDetails);
      }

      setBalances(tradeExecutor.getBalances());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trades');
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalanceUSD = (balance: Balance) => {
    if (!priceData) return 0;
    const dexValue = balance.dexAmount * priceData.dex;
    const cexValue = balance.cexAmount * priceData.cex;
    return dexValue + cexValue;
  };

  if (!priceData) return null;

  return (
    <div className="space-y-8">
      {/* Balances Overview */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <Wallet className="mr-2 h-6 w-6 text-blue-500" />
            Wallet Balances
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {balances.map((balance) => (
              <div key={balance.asset} className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{balance.asset}</h3>
                  <span className="text-sm text-gray-500">
                    Total Value: ${getTotalBalanceUSD(balance).toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">DEX Balance</span>
                      <span className="font-medium">{balance.dexAmount.toFixed(4)} {balance.asset}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ≈ ${(balance.dexAmount * priceData.dex).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">CEX Balance</span>
                      <span className="font-medium">{balance.cexAmount.toFixed(4)} {balance.asset}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ≈ ${(balance.cexAmount * priceData.cex).toFixed(2)}
                    </div>
                  </div>
                  
                  {balance.pending > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-700">Pending</span>
                        <span className="font-medium text-yellow-700">
                          {balance.pending.toFixed(4)} {balance.asset}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade Executor */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-blue-500" />
            Execute Trade
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Amount (ETH)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const newAmount = Number(e.target.value);
                    setAmount(newAmount);
                    calculateEstimatedSlippage(newAmount);
                  }}
                  min="0.1"
                  step="0.1"
                  className="block w-full rounded-md border-gray-300 pl-4 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter amount"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">ETH</span>
                </div>
              </div>
            </div>

            {estimatedSlippage > 0 && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Estimated Slippage
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Expected slippage: {(estimatedSlippage * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={executeArbitrage}
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                'Executing Trade...'
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-5 w-5" />
                  Execute Arbitrage
                </>
              )}
            </button>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade History */}
      {tradeHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <BarChart3 className="mr-2 h-6 w-6 text-blue-500" />
              Trade History
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tradeHistory.map((trade) => (
                <TradeDetails key={trade.id} trade={trade} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};