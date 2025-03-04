import React from 'react';
import TradeDetails from '../TradeDetails.js';
import type { TradeDetails as TradeDetailsType } from '../../types/index.js';

interface Props {
  tradeHistory: TradeDetailsType[];
}

export const TradeHistory: React.FC<Props> = ({ tradeHistory }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Trade History</h2>
      {tradeHistory.length === 0 ? (
        <p className="text-gray-600">No trades executed yet.</p>
      ) : (
        <div className="space-y-4">
          {tradeHistory.map((trade) => (
            <TradeDetails key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};
