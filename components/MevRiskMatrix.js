import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Shield, AlertTriangle, XOctagon } from 'lucide-react';
const riskLevels = [
    { level: 'LOW', color: 'green', description: 'Standard arbitrage with minimal MEV risk' },
    { level: 'MEDIUM', color: 'yellow', description: 'Potential for sandwich attacks in high-value trades' },
    { level: 'HIGH', color: 'red', description: 'High risk of frontrunning and sandwich attacks' }
];
const RiskIcon = ({ level }) => {
    switch (level) {
        case 'LOW':
            return _jsx(Shield, { className: "text-green-500" });
        case 'MEDIUM':
            return _jsx(AlertTriangle, { className: "text-yellow-500" });
        case 'HIGH':
            return _jsx(XOctagon, { className: "text-red-500" });
        default:
            return null;
    }
};
const colorClasses = {
    LOW: { bg: 'bg-green-50', border: 'border-green-200' },
    MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
    HIGH: { bg: 'bg-red-50', border: 'border-red-200' }
};
export const MevRiskMatrix = () => {
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "MEV Risk Assessment" }), _jsx("div", { className: "space-y-4", children: riskLevels.map((risk) => (_jsx("div", { className: `${colorClasses[risk.level].bg} ${colorClasses[risk.level].border} p-4 rounded-lg`, children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(RiskIcon, { level: risk.level }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium", children: [risk.level, " Risk"] }), _jsx("p", { className: "text-sm text-gray-600", children: risk.description })] })] }) }, risk.level))) }), _jsx("p", { className: "mt-4 text-sm text-gray-600", children: "Note: Risk levels are estimates based on historical MEV activity and market conditions." })] }));
};
