import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import TradeDetails from '../TradeDetails';
export const TradeHistory = ({ tradeHistory }) => {
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Trade History" }), tradeHistory.length === 0 ? (_jsx("p", { className: "text-gray-600", children: "No trades executed yet." })) : (_jsx("div", { className: "space-y-4", children: tradeHistory.map((trade) => (_jsx(TradeDetails, { trade: trade }, trade.id))) }))] }));
};
