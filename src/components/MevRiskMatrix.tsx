import React from 'react';
import { Shield, AlertTriangle, XOctagon } from 'lucide-react';
import type { RiskLevel } from '../types';

const riskLevels: RiskLevel[] = [
  {
    level: 'Low',
    color: 'green',
    description: 'Standard arbitrage with minimal MEV risk'
  },
  {
    level: 'Medium',
    color: 'yellow',
    description: 'Potential for sandwich attacks in high-value trades'
  },
  {
    level: 'High',
    color: 'red',
    description: 'High risk of frontrunning and sandwich attacks'
  }
];

const RiskIcon: React.FC<{ level: RiskLevel['level'] }> = ({ level }) => {
  switch (level) {
    case 'Low':
      return <Shield className="text-green-500" />;
    case 'Medium':
      return <AlertTriangle className="text-yellow-500" />;
    case 'High':
      return <XOctagon className="text-red-500" />;
  }
};

export const MevRiskMatrix: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">MEV Risk Assessment</h2>
      
      <div className="space-y-4">
        {riskLevels.map((risk) => (
          <div 
            key={risk.level}
            className={`p-4 rounded-lg bg-${risk.color}-50 border border-${risk.color}-200`}
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