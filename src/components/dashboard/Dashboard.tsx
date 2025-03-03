import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { TradeHistory } from './TradeHistory';
import { PriceData, TradeDetails } from '../../types';
import { ArbitrageEngine } from '../../utils/arbitrage/arbitrageEngine';

interface DashboardProps {
  useMockData: boolean;
  setUseMockData: (useMockData: boolean) => void;
  priceHistory: PriceData[];
  setPriceHistory: Dispatch<SetStateAction<PriceData[]>>;
}

export const Dashboard: React.FC<DashboardProps> = ({ useMockData, setUseMockData, priceHistory, setPriceHistory }) => {
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
