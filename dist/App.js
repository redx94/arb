"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const errorBoundary_1 = require("./utils/errorBoundary");
const arbitrageEngine_1 = require("./utils/arbitrage/arbitrageEngine");
const monitoring_1 = require("./utils/monitoring");
const Dashboard_1 = __importDefault(require("./components/dashboard/Dashboard"));
const priceFeeds_1 = require("./utils/priceFeeds");
const App = () => {
    const [useMockData, setUseMockData] = (0, react_1.useState)(true);
    const [priceHistory, setPriceHistory] = (0, react_1.useState)([
        { token: 'ETH', price: 2000, dex: 1990, cex: 2010, timestamp: Date.now(), amount: 1 },
        { token: 'ETH', price: 2010, dex: 2000, cex: 2020, timestamp: Date.now(), amount: 1 },
        { token: 'ETH', price: 2020, dex: 2010, cex: 2030, timestamp: Date.now(), amount: 1 },
    ]);
    const logger = monitoring_1.Logger.getInstance();
    (0, react_1.useEffect)(() => {
        const arbitrageEngine = arbitrageEngine_1.ArbitrageEngine.getInstance();
        const priceFeed = priceFeeds_1.PriceFeed.getInstance();
        priceFeed.setMockMode(true);
        priceHistory.forEach(data => priceFeed.updatePrice(data));
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
    return ((0, jsx_runtime_1.jsx)(errorBoundary_1.GlobalErrorBoundary, { children: (0, jsx_runtime_1.jsx)(Dashboard_1.default, { useMockData: useMockData, setUseMockData: setUseMockData, priceHistory: priceHistory }) }));
};
exports.default = App;
