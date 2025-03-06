import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { TradeHistory } from './TradeHistory';
import { SystemStatus } from './SystemStatus';
import { MarketDataFeeds } from './MarketDataFeeds';
import { FlashLoanInformation } from './FlashLoanInformation';
import { PerformanceMetricsDashboard } from './PerformanceMetricsDashboard';
import { RiskManagementDashboard } from './RiskManagementDashboard';
import { TradingControlsDashboard } from './TradingControlsDashboard';
import { ArbitrageEngine } from '../../utils/arbitrage/arbitrageEngine';
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
    return (_jsxs("div", { className: "p-8 space-y-8", children: [_jsx("div", { children: _jsx(SystemStatus, {}) }), _jsx("div", { children: _jsx(MarketDataFeeds, {}) }), _jsx(ArbitrageOpportunities, { opportunities: arbitrageOpportunities }), _jsx(TradeHistory, { tradeHistory: tradeHistory }), _jsx("div", { children: _jsx(PerformanceMetricsDashboard, {}) }), _jsx("div", { children: _jsx(RiskManagementDashboard, {}) }), _jsx("div", { children: _jsx(TradingControlsDashboard, {}) }), _jsx("div", { children: _jsx(FlashLoanInformation, {}) }), _jsx(ArbitrageVisualizer, { useMockData: useMockData, setUseMockData: setUseMockData, priceHistory: priceHistory })] }));
};
export default Dashboard;
