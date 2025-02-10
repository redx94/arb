import React from 'react';
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Trade } from '../../types';

interface Props {
  trades: Trade[];
}

export const TradeHistory: React.FC<Props> = ({ trades }) => {
  const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <History className="mr-2 h-6 w-6 text-blue-600" />
        Trade History
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {trade.type === 'BUY' ? (
                      <ArrowUpRight className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className={trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                      {trade.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {trade.platform}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {Number(trade.amount).toFixed(4)} ETH
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${trade.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trade.status === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800'
                      : trade.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trades.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No trades executed yet
          </div>
        )}
      </div>
    </div>
  );
};
