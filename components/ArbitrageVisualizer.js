import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { LineChart } from './LineChart';
import { PriceDisplay } from './PriceDisplay';
import { ScenarioLoader } from './ScenarioLoader';
import { MevRiskMatrix } from './MevRiskMatrix';
import { ArbitrageWalkthrough } from './ArbitrageWalkthrough';
import { TradeExecutor } from './TradeExecutor';
export const ArbitrageVisualizer = ({ useMockData, setUseMockData, priceHistory }) => {
    const [currentScenario, setCurrentScenario] = useState({
        name: 'Normal Market',
        description: 'Normal market conditions',
        networkConditions: {
            latency: 50,
            gasPrice: 20,
            blockConfirmationTime: 5,
            networkCongestion: 0.1,
            networkLatency: 100,
            blockTime: 10
        },
        assets: [],
        duration: 60,
        riskThreshold: 0.5
    });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: "flex justify-end mb-4", children: _jsx("button", { onClick: () => setUseMockData(!useMockData), className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: useMockData ? 'Switch to Live Data' : 'Switch to Mock Data' }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(PriceDisplay, { latestPrice: priceHistory[priceHistory.length - 1] }), _jsx(ScenarioLoader, { onScenarioChange: setCurrentScenario, currentScenario: currentScenario, disabled: !useMockData })] }), _jsx(LineChart, { data: priceHistory }), _jsx(TradeExecutor, {}), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(MevRiskMatrix, {}), _jsx(ArbitrageWalkthrough, {})] })] }));
};
