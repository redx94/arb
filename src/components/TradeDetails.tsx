import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { TradeDetails } from '../types';

interface Props {
  trade: TradeDetails;
}

export const TradeDetails: React.FC<Props> = ({ trade }) => {
  const isSuccess = trade.status === 'COMPLETED';
  const hasWarnings = trade.warnings && trade.warnings.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      {/* Header and status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trade #{trade.id.slice(0, 8)}</h3>
        <div className="flex items-center">
          {isSuccess ? (
            <CheckCircle className="text-green-500 h-5 w-5 mr-2" />
          ) : (
            <XCircle className="text-red-500 h-5 w-5 mr-2" />
          )}
          <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {trade.status}
          </span>
        </div>
      </div>
      {/* Trade details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {/* … other fields … */}
          <div className="flex justify-between">
            <span className="text-gray-600">Slippage:</span>
            <span className="font-medium">{((trade.slippage || 0) * 100).toFixed(2)}%</span>
          </div>
        </div>
        {/* Right column */}
        <div className="space-y-2">
          {/* … additional fields … */}
        </div>
      </div>
      {/* Optional sections */}
      {hasWarnings && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          {/* Warning details */}
        </div>
      )}
      {trade.transaction && (
        <div className="mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Transaction Hash:</span>
            <code className="font-mono bg-gray-100 px-2 py-1 rounded">
              {trade.transaction.hash}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
