import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useArbitrageEngine } from '../../hooks/useArbitrageEngine';

export const SystemStatus: React.FC = () => {
  const { status, latency, errors, warnings } = useArbitrageEngine();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Activity className="mr-2 h-6 w-6 text-blue-600" />
        System Status
      </h2>

      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status</span>
          <div className="flex items-center">
            {status === 'running' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="ml-2 font-medium capitalize">{status}</span>
          </div>
        </div>

        {/* Latency */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Latency</span>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="ml-2 font-medium">{latency}ms</span>
          </div>
        </div>

        {/* Active Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Active Warnings</h3>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Errors */}
        {errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Recent Errors</h3>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
