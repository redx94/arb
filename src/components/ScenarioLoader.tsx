import React from 'react';
import { PlayCircle } from 'lucide-react';
import type { SimulationScenario } from '../types';

interface Props {
  onScenarioChange: (scenario: SimulationScenario) => void;
  currentScenario: SimulationScenario;
  disabled?: boolean;
}

const predefinedScenarios: SimulationScenario[] = [
  {
    name: 'Normal Market',
    description: 'Standard market conditions with typical volatility',
    volatility: 0.2,
    dexMultiplier: 1
  },
  {
    name: 'High Volatility',
    description: 'Extreme market movements with significant price swings',
    volatility: 0.5,
    dexMultiplier: 1
  },
  {
    name: 'DEX Premium',
    description: 'DEX prices consistently higher than CEX',
    volatility: 0.2,
    dexMultiplier: 1.05
  },
  {
    name: 'DEX Discount',
    description: 'DEX prices consistently lower than CEX',
    volatility: 0.2,
    dexMultiplier: 0.95
  }
];

export const ScenarioLoader: React.FC<Props> = ({ onScenarioChange, currentScenario, disabled }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Market Scenarios</h2>
      
      <div className="space-y-4">
        {predefinedScenarios.map((scenario) => (
          <button
            key={scenario.name}
            onClick={() => onScenarioChange(scenario)}
            disabled={disabled}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' :
              currentScenario.name === scenario.name
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{scenario.name}</h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
              <PlayCircle className={`${
                currentScenario.name === scenario.name ? 'text-blue-500' : 'text-gray-400'
              }`} />
            </div>
          </button>
        ))}
      </div>

      {disabled && (
        <p className="mt-4 text-sm text-gray-600">
          Scenarios are only available in mock data mode
        </p>
      )}
    </div>
  );
};