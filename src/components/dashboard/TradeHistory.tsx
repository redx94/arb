import React from 'react';
import { TradeDetails } from '../TradeDetails';
import type { TradeDetails as TradeDetailsType } from '../../types';

interface Props {
  history?: TradeDetailsType[];
}

export const TradeHistory: React.FC<Props> = ({ history = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Trade History</h2>
      {history.length === 0 ? (
        <p className="text-gray-600">No trades executed yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((trade) => (
            <TradeDetails key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};
