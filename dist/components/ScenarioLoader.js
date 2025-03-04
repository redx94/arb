import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PlayCircle } from 'lucide-react';
const predefinedScenarios = [
    {
        name: 'Normal Market',
        networkConditions: {
            gasPrice: 50,
            networkLatency: 100,
            blockTime: 15,
            blockConfirmationTime: 12,
            latency: 35,
            networkCongestion: 0.15
        },
        riskThreshold: 0.01,
        description: '',
        assets: [],
        duration: 0
    },
    {
        name: 'High Volatility',
        networkConditions: {
            gasPrice: 60,
            networkLatency: 120,
            blockTime: 18,
            blockConfirmationTime: 15,
            latency: 50,
            networkCongestion: 0.3
        },
        riskThreshold: 0.02,
        description: '',
        assets: [],
        duration: 0
    },
    {
        name: 'DEX Premium',
        networkConditions: {
            gasPrice: 55,
            networkLatency: 110,
            blockTime: 16,
            blockConfirmationTime: 13,
            latency: 40,
            networkCongestion: 0.2
        },
        riskThreshold: 0.015,
        description: '',
        assets: [],
        duration: 0
    },
    {
        name: 'DEX Discount',
        networkConditions: {
            gasPrice: 45,
            networkLatency: 90,
            blockTime: 14,
            blockConfirmationTime: 11,
            latency: 30,
            networkCongestion: 0.1
        },
        riskThreshold: 0.005,
        description: '',
        assets: [],
        duration: 0
    }
];
export const ScenarioLoader = ({ onScenarioChange, currentScenario, disabled }) => {
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Market Scenarios" }), _jsx("div", { className: "space-y-4", children: predefinedScenarios.map((scenario) => (_jsx("button", { onClick: () => onScenarioChange(scenario), disabled: disabled, className: `w-full p-4 rounded-lg text-left transition-colors ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : currentScenario.name === scenario.name
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { children: _jsx("h3", { className: "font-medium", children: scenario.name }) }), _jsx(PlayCircle, { className: `${currentScenario.name === scenario.name ? 'text-blue-500' : 'text-gray-400'}` })] }) }, scenario.name))) }), disabled && (_jsx("p", { className: "mt-4 text-sm text-gray-600", children: "Scenarios are only available in mock data mode" }))] }));
};
