import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradeStore } from '../../utils/store';
import { PriceFeed } from '../../utils/priceFeeds';
import { Logger } from '../../utils/monitoring';
const logger = Logger.getInstance();
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradeStore } from '../../utils/store';
import { PriceFeed } from '../../utils/priceFeeds';
import { Logger } from '../../utils/monitoring';
const logger = Logger.getInstance();
export const MarketDataFeeds = () => {
    const [markets, setMarkets] = React.useState({
        'ETH/USDT': {
            dex: { name: 'Uniswap V3', price: 0 },
            cex: { name: 'Binance', price: 0 },
            spread: 0,
            network: 'Ethereum',
            lastUpdate: Date.now()
        },
        'USDC/ETH': {
            dex: { name: 'SushiSwap', price: 0 },
            cex: { name: 'Coinbase', price: 0 },
            spread: 0,
            network: 'Ethereum',
            lastUpdate: Date.now()
        },
        'WBTC/ETH': {
            dex: { name: 'Curve', price: 0 },
            cex: { name: 'Kraken', price: 0 },
            spread: 0,
            network: 'Ethereum',
            lastUpdate: Date.now()
        }
    });
    const [status, setStatus] = React.useState('disconnected');
    const [lastUpdate, setLastUpdate] = React.useState(Date.now());
    const updatePriceHistory = useTradeStore(state => state.updatePriceHistory);
    React.useEffect(() => {
        const priceFeed = PriceFeed.getInstance();
        const handlePriceUpdate = (data) => {
            try {
                setMarkets(prev => ({
                    ...prev,
                    'ETH/USDT': {
                        ...prev['ETH/USDT'],
                        dex: { ...prev['ETH/USDT'].dex, price: Number(data.dex) },
                        cex: { ...prev['ETH/USDT'].cex, price: Number(data.cex) },
                        spread: Number((Math.abs(data.dex - data.cex) * 100) / data.cex),
                        lastUpdate: Number(data.timestamp)
                    }
                }));
                setLastUpdate(Number(data.timestamp));
                setStatus('connected');
                updatePriceHistory(data);
            }
            catch (error) {
                logger.error('Error updating market data:', error);
                setStatus('error');
            }
        };
        // Subscribe to price updates
        const unsubscribe = priceFeed.subscribe(handlePriceUpdate);
        // Set initial status
        setStatus('connected');
        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
            setStatus('disconnected');
        };
    }, [updatePriceHistory]);
    return (_jsxs("div", { className: "bg-gray-50 rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold flex items-center", children: [_jsx(Activity, { className: "mr-2 h-6 w-6 text-blue-600" }), "Live Market Data"] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-sm ${status === 'connected'
                                    ? 'bg-green-100 text-green-800'
                                    : status === 'error'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'}`, children: status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Disconnected' }), _jsxs("span", { className: "ml-4 text-sm text-gray-500", children: ["Last update: ", new Date(lastUpdate).toLocaleTimeString()] })] })] }), _jsx("div", { className: "space-y-4", children: Object.entries(markets).map(([pair, data]) => (_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "font-medium text-lg", children: pair }), _jsx("span", { className: "ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full", children: data.network })] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Updated: ", new Date(data.lastUpdate).toLocaleTimeString()] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm text-gray-600", children: data.dex.name }), _jsx("span", { className: "text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full", children: "DEX" })] }), _jsxs("div", { className: "text-lg font-semibold", children: ["$", data.dex.price.toFixed(2)] })] }), _jsxs("div", { className: "p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm text-gray-600", children: data.cex.name }), _jsx("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full", children: "CEX" })] }), _jsxs("div", { className: "text-lg font-semibold", children: ["$", data.cex.price.toFixed(2)] })] }), _jsxs("div", { className: "p-3 bg-white rounded-lg shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Spread" }), data.spread > 0.5 ? (_jsx(TrendingUp, { className: "h-4 w-4 text-green-500" })) : (_jsx(TrendingDown, { className: "h-4 w-4 text-red-500" }))] }), _jsxs("div", { className: `text-lg font-semibold ${data.spread > 0.5 ? 'text-green-600' : 'text-red-600'}`, children: [data.spread.toFixed(2), "%"] })] })] }), data.spread > 1 && (_jsx("div", { className: "mt-3 p-2 bg-green-50 rounded-lg", children: _jsxs("div", { className: "flex items-center text-sm text-green-700", children: [_jsx(AlertCircle, { className: "h-4 w-4 mr-2" }), "Significant arbitrage opportunity detected"] }) }))] }, pair))) })] }));
};
