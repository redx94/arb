import React from 'react';
import { GasOptimizationMetrics } from '../GasOptimizationMetrics';

export const SystemOptimizationDashboard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">System Optimization</h2>
      <GasOptimizationMetrics />
      {/* Additional optimization metrics can be added here */}
    </div>
  );
};
