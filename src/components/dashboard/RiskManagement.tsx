import React, { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

export const RiskManagement: React.FC = () => {
  const [maxDrawdown, setMaxDrawdown] = useState<number>(20); // 20%
  const [positionLimit, setPositionLimit] = useState<number>(5); // 5 ETH
  const [stopLoss, setStopLoss] = useState<number>(2); // 2%
  const [emergencyShutdown, setEmergencyShutdown] = useState<boolean>(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Shield className="mr-2 h-6 w-6 text-blue-600" />
        Risk Management
      </h2>

      <div className="space-y-4">
        {/* Maximum Drawdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Drawdown (%)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={maxDrawdown}
              onChange={(e) => setMaxDrawdown(Number(e.target.value))}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <TrendingDown className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Maximum allowable portfolio value decrease
          </p>
        </div>

        {/* Position Size Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position Size Limit (ETH)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={positionLimit}
              onChange={(e) => setPositionLimit(Number(e.target.value))}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Maximum size for individual positions
          </p>
        </div>

        {/* Stop Loss */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Global Stop Loss (%)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Automatic position closure threshold
          </p>
        </div>

        {/* Emergency Controls */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-800">Emergency Shutdown</h3>
              <p className="text-sm text-red-600">
                Immediately stops all trading activity
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyShutdown}
                onChange={(e) => setEmergencyShutdown(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
