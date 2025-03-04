export function calculateProfit(trade) {
    if (trade.type === 'SELL') {
        return Number(trade.amount * trade.price - (trade.gasCost || 0n));
    }
    else {
        return Number(-(trade.amount * trade.price + (trade.gasCost || 0n)));
    }
}
