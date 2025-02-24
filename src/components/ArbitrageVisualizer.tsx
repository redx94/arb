import React, { useState, useEffect } from 'react';
import { LineChart } from './LineChart';
import { PriceDisplay } from './PriceDisplay';
import { ScenarioLoader } from './ScenarioLoader';
import { MevRiskMatrix } from './MevRiskMatrix';
import { ArbitrageWalkthrough } from './ArbitrageWalkthrough';
import { TradeExecutor } from './TradeExecutor';
import { PriceFeed } from '../utils/priceFeeds';
import { PriceData, SimulationScenario, Trade, NetworkConditions } from '../types';

export const ArbitrageVisualizer: React.FC = () => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [useMockData, setUseMockData] = useState<boolean>(true);
const [currentScenario, setCurrentScenario] = useState<SimulationScenario>({
  volatility: 0.2,
  dexMultiplier: 1,
  name: 'Normal Market',
  networkConditions: NetworkConditions.Stable,
  profitThreshold: 0.5
});

  useEffect(() => {
    const priceFeed = PriceFeed.getInstance();
    priceFeed.setMockMode(useMockData);
    const unsubscribe = priceFeed.subscribe('price', (newPrice: any) => {
      setPriceHistory(prev => [...prev.slice(-50), newPrice]);
    });
    return () => unsubscribe();
  }, [useMockData]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setUseMockData(!useMockData)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {useMockData ? 'Switch to Live Data' : 'Switch to Mock Data'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceDisplay latestPrice={priceHistory[priceHistory.length - 1]} />
        <ScenarioLoader onScenarioChange={setCurrentScenario} currentScenario={currentScenario} disabled={!useMockData} />
      </div>
      <LineChart data={priceHistory} />
      <TradeExecutor priceData={priceHistory[priceHistory.length - 1]} onTradeComplete={(trade) => {
  if ('timestamp' in trade && typeof trade.timestamp === 'number') {
    setTrades(prev => [...prev, { ...trade, timestamp: Number(trade.timestamp) }]);
  }
}} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MevRiskMatrix />
        <ArbitrageWalkthrough />
      </div>
    </div>
  );
};
