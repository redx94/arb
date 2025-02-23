import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PriceData } from '../types';

interface Props {
  latestPrice?: PriceData;
}

export const PriceDisplay: React.FC<Props> = ({ latestPrice }) => {
  if (!latestPrice) return null;

  const priceDifference = latestPrice.dex - latestPrice.cex;
  const arbitrageOpportunity = Math.abs(priceDifference) > (latestPrice.cex * 0.01);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Current Prices</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">DEX Price</div>
          <div className="text-2xl font-bold">${latestPrice.dex.toFixed(2)}</div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">CEX Price</div>
          <div className="text-2xl font-bold">${latestPrice.cex.toFixed(2)}</div>
        </div>
      </div>

      <div className={`mt-4 p-4 rounded-lg ${arbitrageOpportunity ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center space-x-2">
          {priceDifference > 0 ? <TrendingUp className="text-green-500" /> : <TrendingDown className="text-red-500" />}
          <span className="font-medium">
            Price Difference: ${Math.abs(priceDifference).toFixed(2)}
          </span>
        </div>
        {arbitrageOpportunity && (
          <div className="text-green-700 text-sm mt-2">
            Potential arbitrage opportunity detected!
          </div>
        )}
      </div>
    </div>
  );
};