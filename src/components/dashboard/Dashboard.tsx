import React, { useState, useEffect } from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer.js';
import { ArbitrageOpportunities } from './ArbitrageOpportunities.js';
import { TradeHistory } from './TradeHistory.js';
import { PriceData, TradeDetails } from '../../types/index.ts';
import { ArbitrageEngine } from '../../utils/arbitrage/arbitrageEngine.js';

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
    </div>
  );
};

export default Dashboard;
