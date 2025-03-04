import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer.js';
import { ArbitrageOpportunities } from './ArbitrageOpportunities.js';
import { TradeHistory } from './TradeHistory.js';
import { ArbitrageEngine } from '../../utils/arbitrage/arbitrageEngine.js';
export const Dashboard = ({ useMockData, setUseMockData, priceHistory }) => {
    const [tradeHistory, setTradeHistory] = useState([]);
    const [arbitrageOpportunities, setArbitrageOpportunities] = useState([]);
    useEffect(() => {
        const arbitrageEngine = ArbitrageEngine.getInstance();
        const handleTradeExecuted = (trade) => {
            setTradeHistory(prev => [...prev, trade]);
        };
        const handleOpportunity = (opportunity) => {
            setArbitrageOpportunities(prev => [...prev, opportunity]);
        };
        arbitrageEngine.on('tradeExecuted', handleTradeExecuted);
        arbitrageEngine.on('opportunity', handleOpportunity);
        return () => {
            arbitrageEngine.off('tradeExecuted', handleTradeExecuted);
            arbitrageEngine.off('opportunity', handleOpportunity);
        };
    }, []);
    return (_jsxs("div", { className: "p-8 space-y-8", children: [_jsx(ArbitrageVisualizer, { useMockData: useMockData, setUseMockData: setUseMockData, priceHistory: priceHistory }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsx(ArbitrageOpportunities, { opportunities: arbitrageOpportunities }), _jsx(TradeHistory, { tradeHistory: tradeHistory })] })] }));
};
export default Dashboard;
