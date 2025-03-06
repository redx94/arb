import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { GlobalErrorBoundary } from "./utils/errorBoundary";
import { ArbitrageEngine } from "./utils/arbitrage/arbitrageEngine";
import { Logger } from "./utils/monitoring";
import Dashboard from "./components/dashboard/Dashboard";
import { PriceFeed } from "./utils/priceFeeds";

const App = () => {
    const [useMockData, setUseMockData] = useState(true);
    const [priceHistory, setPriceHistory] = useState([
        { token: 'ETH', price: 2000, dex: 1990, cex: 2010, timestamp: Date.now(), amount: 1, source: 'DEX' },
        { token: 'ETH', price: 2010, dex: 2000, cex: 2020, timestamp: Date.now(), amount: 1, source: 'CEX' },
        { token: 'ETH', price: 2020, dex: 2010, cex: 2030, timestamp: Date.now(), amount: 1, source: 'DEX' },
    ]);

    const logger = Logger.getInstance();

    useEffect(() => {
        const dexPriceFeed = PriceFeed.getInstance('DEX');
        const cexPriceFeed = PriceFeed.getInstance('CEX');
        dexPriceFeed.setMockMode(true);
        cexPriceFeed.setMockMode(true);

        priceHistory.forEach(data => {
            if (data.source === 'DEX') {
                dexPriceFeed.updatePrice(data);
            } else if (data.source === 'CEX') {
                cexPriceFeed.updatePrice(data);
            }
        });

        const arbitrageEngine = ArbitrageEngine.getInstance([dexPriceFeed, cexPriceFeed]);
        arbitrageEngine.start();

        const handleArbitrageOpportunity = (data) => {
            console.log('Arbitrage opportunity:', data);
        };

        const handleTradeExecution = (trade) => {
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

    return (_jsx(GlobalErrorBoundary, { children: _jsx(Dashboard, { useMockData: useMockData, setUseMockData: setUseMockData, priceHistory: priceHistory }) }));
};

export default App;
