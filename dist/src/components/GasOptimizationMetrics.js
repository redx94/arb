import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Gauge, TrendingDown, Zap, DollarSign } from 'lucide-react';
export const GasOptimizationMetrics = () => {
    const [metrics, setMetrics] = useState({
        savedGas: '0',
        averageGasPrice: '0',
        failedTransactions: 0,
        optimizationRate: 0
    });
    useEffect(() => {
        // const gasOptimizer = GasOptimizer.getInstance();
        const updateMetrics = async () => {
            // In a real implementation, fetch these from gasOptimizer
            setMetrics({
                savedGas: '1.25',
                averageGasPrice: '45',
                failedTransactions: 2,
                optimizationRate: 94
            });
        };
        updateMetrics();
        const interval = setInterval(updateMetrics, 10000);
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center", children: [_jsx(Gauge, { className: "mr-2 h-6 w-6 text-blue-600" }), "Gas Optimization Metrics"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "Gas Saved" }), _jsx(DollarSign, { className: "h-5 w-5 text-green-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-green-900", children: [metrics.savedGas, " ETH"] }), _jsx("p", { className: "text-sm text-green-700 mt-1", children: "Total gas costs saved" })] }), _jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-blue-800", children: "Average Gas Price" }), _jsx(Zap, { className: "h-5 w-5 text-blue-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-blue-900", children: [metrics.averageGasPrice, " Gwei"] }), _jsx("p", { className: "text-sm text-blue-700 mt-1", children: "Current network conditions" })] }), _jsxs("div", { className: "p-4 bg-red-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Failed Transactions" }), _jsx(TrendingDown, { className: "h-5 w-5 text-red-600" })] }), _jsx("p", { className: "text-2xl font-bold text-red-900", children: metrics.failedTransactions }), _jsx("p", { className: "text-sm text-red-700 mt-1", children: "Due to gas issues" })] }), _jsxs("div", { className: "p-4 bg-purple-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-sm font-medium text-purple-800", children: "Optimization Rate" }), _jsx(Gauge, { className: "h-5 w-5 text-purple-600" })] }), _jsxs("p", { className: "text-2xl font-bold text-purple-900", children: [metrics.optimizationRate, "%"] }), _jsx("p", { className: "text-sm text-purple-700 mt-1", children: "Successful optimizations" })] })] })] }));
};
