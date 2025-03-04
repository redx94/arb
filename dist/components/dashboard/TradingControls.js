import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Play, Pause, Settings, RefreshCw } from 'lucide-react';
import { useArbitrageEngine } from '../../hooks/useArbitrageEngine';
export const TradingControls = () => {
    const { start, stop, isRunning, resetSystem, updateSettings } = useArbitrageEngine();
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        minProfitThreshold: 0.2,
        maxSlippage: 0.5,
        gasMultiplier: 1.2,
        flashLoanEnabled: true
    });
    const handleSettingsUpdate = () => {
        updateSettings(settings);
        setShowSettings(false);
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center", children: [_jsx(Settings, { className: "mr-2 h-6 w-6 text-blue-600" }), "Trading Controls"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: isRunning ? stop : start, className: `flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium ${isRunning
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`, children: isRunning ? (_jsxs(_Fragment, { children: [_jsx(Pause, { className: "mr-2 h-5 w-5" }), "Stop Trading"] })) : (_jsxs(_Fragment, { children: [_jsx(Play, { className: "mr-2 h-5 w-5" }), "Start Trading"] })) }), _jsxs("button", { onClick: resetSystem, className: "flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200", children: [_jsx(RefreshCw, { className: "mr-2 h-5 w-5" }), "Reset"] })] }), _jsxs("button", { onClick: () => setShowSettings(!showSettings), className: "w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100", children: [_jsx(Settings, { className: "mr-2 h-5 w-5" }), "Configure Settings"] }), showSettings && (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Minimum Profit Threshold (%)" }), _jsx("input", { type: "number", value: settings.minProfitThreshold, onChange: (e) => setSettings(s => ({
                                            ...s,
                                            minProfitThreshold: parseFloat(e.target.value)
                                        })), className: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Maximum Slippage (%)" }), _jsx("input", { type: "number", value: settings.maxSlippage, onChange: (e) => setSettings(s => ({
                                            ...s,
                                            maxSlippage: parseFloat(e.target.value)
                                        })), className: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Gas Price Multiplier" }), _jsx("input", { type: "number", value: settings.gasMultiplier, onChange: (e) => setSettings(s => ({
                                            ...s,
                                            gasMultiplier: parseFloat(e.target.value)
                                        })), className: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: settings.flashLoanEnabled, onChange: (e) => setSettings(s => ({
                                            ...s,
                                            flashLoanEnabled: e.target.checked
                                        })), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { className: "ml-2 block text-sm text-gray-700", children: "Enable Flash Loans" })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: handleSettingsUpdate, className: "flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700", children: "Save Settings" }), _jsx("button", { onClick: () => setShowSettings(false), className: "flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200", children: "Cancel" })] })] }))] })] }));
};
