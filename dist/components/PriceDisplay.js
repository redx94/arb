import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TrendingUp, TrendingDown } from 'lucide-react';
export const PriceDisplay = ({ latestPrice }) => {
    if (!latestPrice)
        return null;
    const priceDifference = latestPrice.dex - latestPrice.cex;
    const arbitrageOpportunity = Math.abs(priceDifference) > (latestPrice.cex * 0.01);
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Current Prices" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "DEX Price" }), _jsxs("div", { className: "text-2xl font-bold", children: ["$", latestPrice.dex.toFixed(2)] })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "CEX Price" }), _jsxs("div", { className: "text-2xl font-bold", children: ["$", latestPrice.cex.toFixed(2)] })] })] }), _jsxs("div", { className: `mt-4 p-4 rounded-lg ${arbitrageOpportunity ? 'bg-green-50' : 'bg-gray-50'}`, children: [_jsxs("div", { className: "flex items-center space-x-2", children: [priceDifference > 0 ? _jsx(TrendingUp, { className: "text-green-500" }) : _jsx(TrendingDown, { className: "text-red-500" }), _jsxs("span", { className: "font-medium", children: ["Price Difference: $", Math.abs(priceDifference).toFixed(2)] })] }), arbitrageOpportunity && (_jsx("div", { className: "text-green-700 text-sm mt-2", children: "Potential arbitrage opportunity detected!" }))] })] }));
};
