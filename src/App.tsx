import React, { FC, useEffect, useState } from "react";
import { GlobalErrorBoundary } from "./utils/errorBoundary";
import { ArbitrageEngine } from "./utils/arbitrage/arbitrageEngine";
import { Logger } from "./utils/monitoring";
import Dashboard from "./components/dashboard/Dashboard";
import { PriceFeed } from "./utils/priceFeeds";
import type { PriceData } from "./types";

const App: FC = () => {
  const [useMockData, setUseMockData] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([
    { token: 'ETH', price: 2000, dex: 1990, cex: 2010, timestamp: Date.now(), amount: 1 },
    { token: 'ETH', price: 2010, dex: 2000, cex: 2020, timestamp: Date.now(), amount: 1 },
    { token: 'ETH', price: 2020, dex: 2010, cex: 2030, timestamp: Date.now(), amount: 1 },
  ]);
  const logger = Logger.getInstance();

  useEffect(() => {
    const arbitrageEngine = ArbitrageEngine.getInstance();
    const priceFeed = PriceFeed.getInstance();
    priceFeed.setMockMode(true);

    priceHistory.forEach(data => priceFeed.updatePrice(data));
    arbitrageEngine.start();

    const handleArbitrageOpportunity = (data: any) => {
      console.log('Arbitrage opportunity:', data);
    };

    const handleTradeExecution = (trade: any) => {
      console.log('Trade executed:', trade);
    };

    arbitrageEngine.on('arbitrageOpportunity', handleArbitrageOpportunity);
    arbitrageEngine.on('tradeExecuted', handleTradeExecution);

    return () => {
      arbitrageEngine.stop();
      arbitrageEngine.removeListener('arbitrageOpportunity', handleArbitrageOpportunity);
      arbitrageEngine.removeListener('tradeExecuted', handleTradeExecution);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <Dashboard useMockData={useMockData} setUseMockData={setUseMockData} priceHistory={priceHistory} />
    </GlobalErrorBoundary>
  );
};

export default App;
