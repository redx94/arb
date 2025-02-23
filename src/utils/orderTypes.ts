import { PriceData, Trade } from '../types';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TRAILING_STOP';

export interface AdvancedOrder extends Omit<Trade, 'status'> {
  orderType: OrderType;
  triggerPrice?: number;
  trailingDistance?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  expiryTime?: number;
}

export class OrderManager {
  private orders: AdvancedOrder[] = [];
  private lastPrice: number = 0;

  public addOrder(order: AdvancedOrder) {
    this.orders.push(order);
  }

  public updateOrders(priceData: PriceData) {
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

  private checkLimitOrder(order: AdvancedOrder, currentPrice: number): boolean {
    if (!order.triggerPrice) return true;
    
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

  private checkStopLoss(order: AdvancedOrder, currentPrice: number): boolean {
    if (!order.triggerPrice) return true;
    
    if (currentPrice <= order.triggerPrice) {
      this.executeOrder(order);
      return false;
    }
    return true;
  }

  private checkTrailingStop(order: AdvancedOrder, currentPrice: number): boolean {
    if (!order.trailingDistance) return true;
    
    const stopPrice = this.lastPrice - order.trailingDistance;
    if (currentPrice <= stopPrice) {
      this.executeOrder(order);
      return false;
    }
    return true;
  }

  private async executeOrder(order: AdvancedOrder) {
    // Implementation of order execution
    console.log('Executing order:', order);
  }
}