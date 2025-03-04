export class OrderManager {
    constructor() {
        Object.defineProperty(this, "orders", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "lastPrice", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    addOrder(order) {
        this.orders.push(order);
    }
    updateOrders(priceData) {
        this.orders = this.orders.filter(order => {
            const currentPrice = order.platform === 'DEX' ? priceData.dex : priceData.cex;
            switch (order.orderType) {
                case 'LIMIT':
                    return this.checkLimitOrder(order, currentPrice);
                case 'STOP_LOSS':
                    return this.checkStopLoss(order, currentPrice);
                case 'TRAILING_STOP':
                    return this.checkTrailingStop(order, currentPrice);
                default:
                    return true;
            }
        });
        this.lastPrice = priceData.dex;
    }
    checkLimitOrder(order, currentPrice) {
        if (!order.triggerPrice)
            return true;
        if (order.type === 'BUY' && currentPrice <= order.triggerPrice) {
            this.executeOrder(order);
            return false;
        }
        if (order.type === 'SELL' && currentPrice >= order.triggerPrice) {
            this.executeOrder(order);
            return false;
        }
        return true;
    }
    checkStopLoss(order, currentPrice) {
        if (!order.triggerPrice)
            return true;
        if (currentPrice <= order.triggerPrice) {
            this.executeOrder(order);
            return false;
        }
        return true;
    }
    checkTrailingStop(order, currentPrice) {
        if (!order.trailingDistance)
            return true;
        const stopPrice = this.lastPrice - order.trailingDistance;
        if (currentPrice <= stopPrice) {
            this.executeOrder(order);
            return false;
        }
        return true;
    }
    async executeOrder(order) {
        // Implementation of order execution
        console.log('Executing order:', order);
    }
}
