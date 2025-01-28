import React from 'react';
import { Activity, Cpu, MemoryStick as Memory, Network, BarChart3, AlertTriangle } from 'lucide-react';
import { SystemOptimizer } from '../../utils/optimization/SystemOptimizer';
import type { SystemMetrics, OptimizationAction } from '../../utils/optimization/types';

export const SystemOptimizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = React.useState<SystemMetrics | null>(null);
  const [recentActions, setRecentActions] = React.useState<OptimizationAction[]>([]);
  const [anomalies, setAnomalies] = React.useState<Array<{
    type: string;
    severity: number;
    metric: string;
  }>>([]);

  React.useEffect(() => {
    const optimizer = SystemOptimizer.getInstance();

    const handleMetricsUpdate = (newMetrics: SystemMetrics) => {
      setMetrics(newMetrics);
    };

    const handleOptimizationAction = (action: OptimizationAction) => {
      setRecentActions(prev => [action, ...prev].slice(0, 5));
    };

    optimizer.on('metricsUpdated', handleMetricsUpdate);
    optimizer.on('optimizationApplied', handleOptimizationAction);

    return () => {
      optimizer.off('metricsUpdated', handleMetricsUpdate);
      optimizer.off('optimizationApplied', handleOptimizationAction);
    };
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Activity className="mr-2 h-6 w-6 text-blue-600" />
          System Health Overview
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {/* CPU Metrics */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-800">CPU</h3>
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{metrics.cpu.usage.toFixed(1)}%</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Temperature</span>
                <span>{metrics.cpu.temperature}°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Frequency</span>
                <span>{metrics.cpu.frequency.toFixed(1)} GHz</span>
              </div>
            </div>
          </div>

          {/* Memory Metrics */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-800">Memory</h3>
              <Memory className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              {(metrics.memory.used / 1024).toFixed(1)} GB
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Available</span>
                <span>{(metrics.memory.available / 1024).toFixed(1)} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Swap</span>
                <span>{(metrics.memory.swapUsage / 1024).toFixed(1)} GB</span>
              </div>
            </div>
          </div>

          {/* Network Metrics */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-800">Network</h3>
              <Network className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">{metrics.network.latency.toFixed(1)} ms</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Bandwidth</span>
                <span>{metrics.network.bandwidth.toFixed(0)} Mbps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Packet Loss</span>
                <span>{(metrics.network.packetLoss * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Optimization Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
          Recent Optimization Actions
        </h2>

        <div className="space-y-4">
          {recentActions.map((action, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{action.type.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-sm text-gray-600">
                    Target: {action.target} | Value: {action.value}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  action.priority > 2 ? 'bg-red-100 text-red-800' :
                  action.priority > 1 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  Priority {action.priority}
                </span>
              </div>
            </div>
          ))}

          {recentActions.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No recent optimization actions
            </p>
          )}
        </div>
      </div>

      {/* System Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-yellow-600" />
            Detected Anomalies
          </h2>

          <div className="space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-800">{anomaly.type}</h3>
                    <p className="text-sm text-yellow-600">
                      Metric: {anomaly.metric} | Severity: {anomaly.severity.toFixed(2)}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};