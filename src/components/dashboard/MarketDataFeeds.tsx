import React from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradeStore } from '../../utils/store';
import { PriceFeed } from '../../utils/priceFeeds';
import { PriceData } from '../../types';
import { Logger } from '../../utils/monitoring';

const logger = Logger.getInstance();

export const MarketDataFeeds: React.FC = () => {
  const [markets, setMarkets] = React.useState<{
    [key: string]: {
      dex: { name: string; price: number };
      cex: { name: string; price: number };
      spread: number;
      network: string;
      lastUpdate: number;
    };
  }>({
    'ETH/USDT': {
      dex: { name: 'Uniswap V3', price: 0 },
      cex: { name: 'Binance', price: 0 },
      spread: 0,
      network: 'Ethereum',
      lastUpdate: Date.now()
    },
    'USDC/ETH': {
      dex: { name: 'SushiSwap', price: 0 },
      cex: { name: 'Coinbase', price: 0 },
      spread: 0,
      network: 'Ethereum',
      lastUpdate: Date.now()
    },
    'WBTC/ETH': {
      dex: { name: 'Curve', price: 0 },
      cex: { name: 'Kraken', price: 0 },
      spread: 0,
      network: 'Ethereum',
      lastUpdate: Date.now()
    }
  });

  const [status, setStatus] = React.useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = React.useState<number>(Date.now());
  const updatePriceHistory = useTradeStore(state => state.updatePriceHistory);

  React.useEffect(() => {
    const priceFeed = PriceFeed.getInstance();

    const handlePriceUpdate = (data: PriceData) => {
      try {
        setMarkets(prev => ({
          ...prev,
          'ETH/USDT': {
            ...prev['ETH/USDT'],
            dex: { ...prev['ETH/USDT'].dex, price: Number(data.dex) },
            cex: { ...prev['ETH/USDT'].cex, price: Number(data.cex) },
            spread: Number((Math.abs(data.dex - data.cex) * 100) / data.cex),
            lastUpdate: Number(data.timestamp)
          }
        }));
        setLastUpdate(Number(data.timestamp));
        setStatus('connected');
        updatePriceHistory(data);
      } catch (error) {
        logger.error('Error updating market data:', error as Error);
        setStatus('error');
      }
    };

    // Subscribe to price updates
    const unsubscribe = priceFeed.subscribe('price', handlePriceUpdate);

    // Set initial status
    setStatus('connected');

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      setStatus('disconnected');
    };
  }, [updatePriceHistory]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Activity className="mr-2 h-6 w-6 text-blue-600" />
          Live Market Data
        </h2>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            status === 'connected'
              ? 'bg-green-100 text-green-800'
              : status === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Disconnected'}
          </span>
          <span className="ml-4 text-sm text-gray-500">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(markets).map(([pair, data]) => (
          <div key={pair} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="font-medium text-lg">{pair}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {data.network}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Updated: {new Date(data.lastUpdate).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* DEX Price */}
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{data.dex.name}</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    DEX
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  ${data.dex.price.toFixed(2)}
                </div>
              </div>

              {/* CEX Price */}
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{data.cex.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    CEX
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  ${data.cex.price.toFixed(2)}
                </div>
              </div>

              {/* Spread */}
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Spread</span>
                  {data.spread > 0.5 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className={`text-lg font-semibold ${
                  data.spread > 0.5 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.spread.toFixed(2)}%
                </div>
              </div>
            </div>

            {data.spread > 1 && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg">
                <div className="flex items-center text-sm text-green-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Significant arbitrage opportunity detected
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
