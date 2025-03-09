import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

interface RiskManagementProps {
    maxDrawdown: number;
    setMaxDrawdown: (value: number) => void;
    positionLimit: number;
    setPositionLimit: (value: number) => void;
    stopLoss: number;
    setStopLoss: (value: number) => void;
    emergencyShutdown: boolean;
    setEmergencyShutdown: (value: boolean) => void;
}

export const RiskManagement = ({
    maxDrawdown,
    setMaxDrawdown,
    positionLimit,
    setPositionLimit,
    stopLoss,
    setStopLoss,
    emergencyShutdown,
    setEmergencyShutdown,
}) => {
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center", children: [_jsx(Shield, { className: "mr-2 h-6 w-6 text-blue-600" }), "Risk Management"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Maximum Drawdown (%)" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "number", value: maxDrawdown, onChange: (e) => setMaxDrawdown(Number(e.target.value)), className: "flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), _jsx(TrendingDown, { className: "h-5 w-5 text-gray-400" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Maximum allowable portfolio value decrease" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Position Size Limit (ETH)" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "number", value: positionLimit, onChange: (e) => setPositionLimit(Number(e.target.value)), className: "flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), _jsx(DollarSign, { className: "h-5 w-5 text-gray-400" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Maximum size for individual positions" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Global Stop Loss (%)" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "number", value: stopLoss, onChange: (e) => setStopLoss(Number(e.target.value)), className: "flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" }), _jsx(AlertTriangle, { className: "h-5 w-5 text-gray-400" })] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Automatic position closure threshold" })] }), _jsx("div", { className: "mt-6 p-4 bg-red-50 rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-red-800", children: "Emergency Shutdown" }), _jsx("p", { className: "text-sm text-red-600", children: "Immediately stops all trading activity" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: emergencyShutdown, onChange: (e) => setEmergencyShutdown(e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" })] })] }) })] })] }));
};
