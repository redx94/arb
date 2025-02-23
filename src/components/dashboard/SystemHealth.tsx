import React from 'react';
import { Activity, Cpu, MemoryStick as Memory, Network } from 'lucide-react';

export const SystemHealth: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Activity className="mr-2 h-6 w-6 text-blue-600" />
        System Health
      </h2>

      <div className="space-y-4">
        {/* CPU Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Cpu className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">CPU Usage</span>
            </div>
            <span className="text-sm text-gray-500">45%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Memory Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Memory className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            </div>
            <span className="text-sm text-gray-500">68%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>

        {/* Network Latency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Network className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Network Latency</span>
            </div>
            <span className="text-sm text-gray-500">85ms</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">All Systems Operational</h3>
              <p className="mt-1 text-sm text-green-600">
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};