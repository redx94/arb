import React from 'react';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';
import type { Trade } from '../../types';

interface Props {
  trades: Trade[];
}

export const PerformanceMetrics: React.FC<Props> = ({ trades }) => {
  // Calculate metrics
  const totalTrades = trades.length;
  const successfulTrades = trades.filter(t => t.status === 'COMPLETED').length;
  const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
  
const totalProfit = trades.reduce((sum, trade) => {
  if (trade.status !== 'COMPLETED') return sum;
  const profit = trade.type === 'SELL'
    ? trade.amount * trade.price
    : -(trade.amount * trade.price);
return sum + BigInt(Number(profit));
}, 0n);

const averageExecutionTime = trades.reduce((sum, trade) =>
  sum + BigInt(trade.executionTime || 0), 0n) / BigInt(totalTrades || 1);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
        Performance Metrics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Success Rate */}
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Success Rate</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{successRate.toFixed(1)}%</p>
          <p className="text-sm text-green-700 mt-1">
            {successfulTrades} of {totalTrades} trades
          </p>
        </div>

        {/* Total Profit */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">Total Profit</h3>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
<p className="text-2xl font-bold text-blue-900">
  ${Number(totalProfit).toFixed(2)}
</p>
          <p className="text-sm text-blue-700 mt-1">
            Net profit across all trades
          </p>
        </div>

        {/* Average Execution Time */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800">Avg. Execution</h3>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
<p className="text-2xl font-bold text-purple-900">
  {Number(averageExecutionTime).toFixed(0)}ms
</p>
          <p className="text-sm text-purple-700 mt-1">
            Average trade execution time
          </p>
        </div>

        {/* Trade Volume */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-800">Trade Volume</h3>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{totalTrades}</p>
          <p className="text-sm text-orange-700 mt-1">
            Total executed trades
          </p>
        </div>
      </div>
    </div>
  );
};
