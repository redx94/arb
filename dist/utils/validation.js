export function validateTrade(trade) {
    // Implement validation logic
    return typeof trade.amount === 'bigint' && typeof trade.price === 'bigint';
}
