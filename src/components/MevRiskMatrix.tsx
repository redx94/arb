import React from 'react';
import { Shield, AlertTriangle, XOctagon } from 'lucide-react';
import type {} from '../types/index.js';

const riskLevels: { level: string; color: string; description: string }[] = [
  { level: 'LOW', color: 'green', description: 'Standard arbitrage with minimal MEV risk' },
  { level: 'MEDIUM', color: 'yellow', description: 'Potential for sandwich attacks in high-value trades' },
  { level: 'HIGH', color: 'red', description: 'High risk of frontrunning and sandwich attacks' }
];

const RiskIcon: React.FC<{ level: string }> = ({ level }) => {
  switch (level) {
    case 'LOW':
      return <Shield className="text-green-500" />;
    case 'MEDIUM':
      return <AlertTriangle className="text-yellow-500" />;
    case 'HIGH':
      return <XOctagon className="text-red-500" />;
    default:
      return null;
  }
};

const colorClasses: Record<string, { bg: string; border: string }> = {
  LOW: { bg: 'bg-green-50', border: 'border-green-200' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  HIGH: { bg: 'bg-red-50', border: 'border-red-200' }
};

export const MevRiskMatrix: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">MEV Risk Assessment</h2>
      <div className="space-y-4">
        {riskLevels.map((risk) => (
          <div 
            key={risk.level}
            className={`${colorClasses[risk.level].bg} ${colorClasses[risk.level].border} p-4 rounded-lg`}
          >
            <div className="flex items-center space-x-3">
              <RiskIcon level={risk.level} />
              <div>
                <h3 className="font-medium">{risk.level} Risk</h3>
                <p className="text-sm text-gray-600">{risk.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Note: Risk levels are estimates based on historical MEV activity and market conditions.
      </p>
    </div>
  );
};
