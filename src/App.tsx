import { FC, useEffect, useState } from "react";
import { GlobalErrorBoundary } from "./utils/errorBoundary";
import { ArbitrageEngine } from "./utils/arbitrage/arbitrageEngine";
import { PriceFeed } from "./utils/priceFeeds";
import { Logger } from "./utils/monitoring";

const App: FC = () => {
  const logger = Logger.getInstance();

  useEffect(() => {
    const arbitrageEngine = ArbitrageEngine.getInstance();
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
      <div>
        <h1>Arbitrage Trading System</h1>
        <p>Data and information will be displayed in the console/terminal.</p>
      </div>
    </GlobalErrorBoundary>
  );
};

export default App;
