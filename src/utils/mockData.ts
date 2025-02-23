import { SimulationScenario } from '../types';

export const generateMockPrices = (scenario?: SimulationScenario) => {
  const basePrice = 3000; // Base ETH price
  const volatility = scenario?.volatility || 0.2;
  const multiplier = scenario?.dexMultiplier || 1;

  const cexPrice = basePrice * (1 + (Math.random() - 0.5) * volatility);
  const dexPrice = cexPrice * multiplier * (1 + (Math.random() - 0.5) * volatility * 2);

  return {
    dex: Number(dexPrice.toFixed(2)),
    cex: Number(cexPrice.toFixed(2)),
    timestamp: Date.now()
  };
};

export const SAFE_PRICE_RANGE = {
  min: 100,
  max: 10000
};

export function sanitizeTradeValue(input: number): number {
  return Math.min(Math.max(input, SAFE_PRICE_RANGE.min), SAFE_PRICE_RANGE.max);
}

export const generateMarketDepth = (basePrice: number, depth: number = 10) => {
  const orders = [];
  const spreadPercentage = 0.002; // 0.2% spread

  // Generate buy orders
  for (let i = 0; i < depth; i++) {
    const priceReduction = basePrice * (spreadPercentage * (i + 1));
    orders.push({
      type: 'BUY',
      price: basePrice - priceReduction,
      amount: Math.random() * 10 + 1
    });
  }

  // Generate sell orders
  for (let i = 0; i < depth; i++) {
    const priceIncrease = basePrice * (spreadPercentage * (i + 1));
    orders.push({
      type: 'SELL',
      price: basePrice + priceIncrease,
      amount: Math.random() * 10 + 1
    });
  }

  return orders;
};

export const calculateSlippage = (orderSize: number, marketDepth: { type: string; price: number; amount: number }[]) => {
  let remainingSize = orderSize;
  let totalCost = 0;
  let avgPrice = 0;

  for (const order of marketDepth) {
    const fillSize = Math.min(remainingSize, order.amount);
    totalCost += fillSize * order.price;
    remainingSize -= fillSize;

    if (remainingSize <= 0) break;
  }

  avgPrice = totalCost / orderSize;
  return {
    avgPrice,
    slippage: Math.abs((avgPrice - marketDepth[0].price) / marketDepth[0].price)
  };
};
