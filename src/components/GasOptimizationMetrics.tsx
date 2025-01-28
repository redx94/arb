import React from 'react';
import { Gauge, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { ethers } from 'ethers';
import { GasOptimizer } from '../utils/gas/GasOptimizer';

export const GasOptimizationMetrics: React.FC = () => {
  const [metrics, setMetrics] = React.useState({
    savedGas: '0',
    averageGasPrice: '0',
    failedTransactions: 0,
    optimizationRate: 0
  });

  React.useEffect(() => {
    const gasOptimizer = GasOptimizer.getInstance();
    
    const updateMetrics = async () => {
      // In a real implementation, these would come from the GasOptimizer
      setMetrics({
        savedGas: '1.25',
        averageGasPrice: '45',
        failedTransactions: 2,
        optimizationRate: 94
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Gauge className="mr-2 h-6 w-6 text-blue-600" />
        Gas Optimization Metrics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Gas Saved</h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{metrics.savedGas} ETH</p>
          <p className="text-sm text-green-700 mt-1">Total gas costs saved</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">Average Gas Price</h3>
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{metrics.averageGasPrice} Gwei</p>
          <p className="text-sm text-blue-700 mt-1">Current network conditions</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-800">Failed Transactions</h3>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">{metrics.failedTransactions}</p>
          <p className="text-sm text-red-700 mt-1">Due to gas issues</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800">Optimization Rate</h3>
            <Gauge className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{metrics.optimizationRate}%</p>
          <p className="text-sm text-purple-700 mt-1">Successful optimizations</p>
        </div>
      </div>
    </div>
  );
};