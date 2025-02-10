import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { useTradeStore } from '../../utils/store';
import { PriceFeed } from '../../utils/priceFeeds';
import { Logger } from '../../utils/monitoring';
import { ErrorHandler } from '../../utils/errors/ErrorHandler';

const logger = Logger.getInstance();
const errorHandler = ErrorHandler.getInstance();

interface ArbitrageOpportunity {
  id: string;
  fromDex: string;
  toDex: string;
  spread: number;
  volume: string;
  risk: 'Low' | 'Medium' | 'High';
  estimatedProfit: number;
  timestamp: number;
}

export const ArbitrageOpportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [marketConditions, setMarketConditions] = useState({
    gasPrice: 45,
    networkLoad: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  const priceHistory = useTradeStore(state => state.priceHistory);
  const priceFeed = PriceFeed.getInstance();

  useEffect(() => {
    const calculateOpportunities = async () => {
      try {
        if (priceHistory.length === 0) return;

        const latestPrice = priceHistory[priceHistory.length - 1];
        const timestamp = Date.now();

        // Calculate spreads and opportunities
        const newOpportunities: ArbitrageOpportunity[] = [
          {
            id: 'uniswap-sushi',
            fromDex: 'Uniswap V3',
            toDex: 'SushiSwap',
            spread: Number((Math.abs(latestPrice.dex - latestPrice.cex) * 100n) / BigInt(latestPrice.cex)),
            volume: '125K',
            risk: 'Low',
            estimatedProfit: Number((Math.abs(latestPrice.dex - latestPrice.cex) * 150n) / 100n),
            timestamp
          },
          {
            id: 'curve-balancer',
            fromDex: 'Curve',
            toDex: 'Balancer',
            spread: Number((Math.abs(latestPrice.dex - latestPrice.cex) * 75n) / BigInt(latestPrice.cex)),
            volume: '250K',
            risk: 'Medium',
            estimatedProfit: Number((Math.abs(latestPrice.dex - latestPrice.cex) * 85n) / 100n),
            timestamp
          }
        ];

        // Update market conditions based on latest data
        const newMarketConditions = {
          gasPrice: Math.floor(30 + Math.random() * 30), // Simulate gas price changes
          networkLoad: calculateNetworkLoad({ dex: BigInt(latestPrice.dex), cex: BigInt(latestPrice.cex) })
        };

        setOpportunities(newOpportunities);
        setMarketConditions(newMarketConditions);
        setLastUpdate(timestamp);
      } catch (error) {
        logger.error('Failed to calculate arbitrage opportunities:', error as Error);
      }
    };

    // Calculate initial opportunities
    calculateOpportunities();

    // Subscribe to price updates
    const unsubscribe = priceFeed.subscribe(async () => {
      await errorHandler.withRetry(
        calculateOpportunities,
        'Opportunity calculation'
      );
    });

    return () => {
      unsubscribe();
    };
  }, [priceHistory, priceFeed]);

  const calculateNetworkLoad = (price: { dex: bigint; cex: bigint }): 'Low' | 'Medium' | 'High' => {
    const spread = BigInt(Math.abs(price.dex - price.cex));
    const spreadPercentage = (spread * 100n) / BigInt(price.cex);
    if (spreadPercentage > 2n) return 'High';
    if (spreadPercentage > 1n) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Zap className="mr-2 h-6 w-6 text-blue-600" />
          Live Arbitrage Opportunities
        </h2>
        <span className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Updated: {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-4">
        {opportunities.map((opp) => (
          <div key={opp.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-medium">{opp.fromDex} → {opp.toDex}</span>
              </div>
              <span className="text-sm text-gray-500">Volume: ${opp.volume}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <span className="text-sm text-gray-600">Spread</span>
                <p className="font-medium text-green-600">{opp.spread.toFixed(2)}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Risk Level</span>
                <p className="font-medium">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    opp.risk === 'Low'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {opp.risk}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Est. Profit</span>
                <p className="font-medium text-green-600">${opp.estimatedProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Market Conditions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Current Market Conditions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-blue-600">Gas Price</span>
              <p className="font-medium">{marketConditions.gasPrice} Gwei</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Network Load</span>
              <p className="font-medium">{marketConditions.networkLoad}</p>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Always verify opportunities and consider gas costs before execution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
