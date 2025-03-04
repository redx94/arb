import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';
export const PerformanceMetrics = ({ trades }) => {
    // Calculate metrics
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === 'COMPLETED').length;
    const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
    const totalProfit = trades.reduce((sum, trade) => {
        if (trade.status !== 'COMPLETED')
            return sum;
        const profit = trade.type === 'SELL'
            ? trade.amount * trade.price
            : -(trade.amount * trade.price);
        return sum + BigInt(Number(profit));
    }, 0n);
    const averageExecutionTime = trades.reduce((sum, trade) => sum + BigInt(trade.executionTime || 0), 0n) / BigInt(totalTrades || 1);
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center", children: [_jsx(BarChart3, { className: "mr-2 h-6 w-6 text-blue-600" }), "Performance Metrics"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "Success Rate" }), _jsx(TrendingUp, { className: "h-5 w-5 text-green-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-green-900", children: [successRate.toFixed(1), "%"] }), _jsxs("p", { className: "text-sm text-green-700 mt-1", children: [successfulTrades, " of ", totalTrades, " trades"] })] }), _jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-blue-800", children: "Total Profit" }), _jsx(DollarSign, { className: "h-5 w-5 text-blue-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-blue-900", children: ["$", Number(totalProfit).toFixed(2)] }), _jsx("p", { className: "text-sm text-blue-700 mt-1", children: "Net profit across all trades" })] }), _jsxs("div", { className: "p-4 bg-purple-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-purple-800", children: "Avg. Execution" }), _jsx(Clock, { className: "h-5 w-5 text-purple-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-purple-900", children: [Number(averageExecutionTime).toFixed(0), "ms"] }), _jsx("p", { className: "text-sm text-purple-700 mt-1", children: "Average trade execution time" })] }), _jsxs("div", { className: "p-4 bg-orange-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-orange-800", children: "Trade Volume" }), _jsx(BarChart3, { className: "h-5 w-5 text-orange-600" })] }), _jsx("p", { className: "text-2xl font-bold text-orange-900", children: totalTrades }), _jsx("p", { className: "text-sm text-orange-700 mt-1", children: "Total executed trades" })] })] })] }));
};
