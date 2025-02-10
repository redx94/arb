import React from 'react';
import type { PriceData } from '../../types';

interface Props {
  opportunities: PriceData[];
}

export const ArbitrageOpportunities: React.FC<Props> = ({ opportunities }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Arbitrage Opportunities</h2>
      {opportunities.length === 0 ? (
        <p className="text-gray-600">No opportunities detected.</p>
      ) : (
        <ul className="space-y-2">
          {opportunities.map((opp, index) => (
            <li key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <span>DEX: {opp.dex}</span>
                <span>CEX: {opp.cex}</span>
                <span>Time: {new Date(opp.timestamp).toLocaleTimeString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
