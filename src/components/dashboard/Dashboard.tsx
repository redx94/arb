import React, { useState, useEffect } from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer.ts';
import { ArbitrageOpportunities } from './ArbitrageOpportunities.ts';
import { TradeHistory } from './TradeHistory.ts';
import { PriceData, TradeDetails } from '../../types/index.ts';
import { ArbitrageEngine } from '../../utils/arbitrage/arbitrageEngine.ts';
import ARSystemDiagnostics from './ARSystemDiagnostics.ts';
import ARPerformanceMetrics from './ARPerformanceMetrics.ts';
import ARMarketData from './ARMarketData.ts';
import ARTradeAnalytics from './ARTradeAnalytics.ts';

interface DashboardProps {
  useMockData: boolean;
  setUseMockData: (useMockData: boolean) => void;
  priceHistory: PriceData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ useMockData, setUseMockData, priceHistory }) => {
  const [tradeHistory, setTradeHistory] = useState<TradeDetails[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<PriceData[]>([]);

  useEffect(() => {
    const arbitrageEngine = ArbitrageEngine.getInstance();

    const handleTradeExecuted = (trade: TradeDetails) => {
      setTradeHistory(prev => [...prev, trade]);
    };

    const handleOpportunity = (opportunity: PriceData) => {
      setArbitrageOpportunities(prev => [...prev, opportunity]);
    };

    arbitrageEngine.on('tradeExecuted', handleTradeExecuted);
    arbitrageEngine.on('opportunity', handleOpportunity);

    return () => {
      arbitrageEngine.off('tradeExecuted', handleTradeExecuted);
      arbitrageEngine.off('opportunity', handleOpportunity);
    };
  }, []);

  return (
    <div className="p-8 space-y-8">
      <ArbitrageVisualizer useMockData={useMockData} setUseMockData={setUseMockData} priceHistory={priceHistory} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ArbitrageOpportunities opportunities={arbitrageOpportunities} />
        <TradeHistory tradeHistory={tradeHistory} />
      </div>

      {/* AR System Diagnostics Section */}
      <div className="mt-16">
        <ARSystemDiagnostics />
      </div>

      {/* AR Performance Metrics Section */}
      <div className="mt-8">
        <ARPerformanceMetrics />
      </div>

      {/* AR Market Data Section */}
      <div className="mt-8">
        <ARMarketData />
      </div>

      {/* AR Trade Analytics Section */}
      <div className="mt-8">
        <ARTradeAnalytics />
      </div>
    </div>
  );
};

export default Dashboard;
