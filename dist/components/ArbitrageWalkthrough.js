import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight } from 'lucide-react';
const steps = [
    {
        title: 'Identify Price Difference',
        description: 'Monitor DEX and CEX prices for significant disparities that exceed gas costs.'
    },
    {
        title: 'Calculate Profit Potential',
        description: 'Factor in transaction fees, slippage, and potential MEV risks.'
    },
    {
        title: 'Execute Trades',
        description: 'Place simultaneous orders on both platforms to capture the price difference.'
    },
    {
        title: 'Monitor Settlement',
        description: 'Ensure both trades complete successfully and verify profit.'
    }
];
export const ArbitrageWalkthrough = () => {
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "How Arbitrage Works" }), _jsx("div", { className: "space-y-6", children: steps.map((step, index) => (_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center", children: index + 1 }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: step.title }), _jsx("p", { className: "text-sm text-gray-600", children: step.description }), index < steps.length - 1 && (_jsx("div", { className: "mt-2 flex justify-center", children: _jsx(ArrowRight, { className: "text-gray-400" }) }))] })] }, index))) }), _jsx("div", { className: "mt-6 p-4 bg-blue-50 rounded-lg", children: _jsx("p", { className: "text-sm text-blue-800", children: "Pro Tip: Always ensure your trading strategy accounts for potential slippage and network congestion." }) })] }));
};
