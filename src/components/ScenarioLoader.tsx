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
    networkConditions: {
      gasPrice: 50,
      networkLatency: 100,
      blockTime: 15,
      confirmationBlocks: 12
    },
    profitThreshold: 0.01,
    volatility: 0.2,
    dexMultiplier: 1
  },
  {
    name: 'High Volatility',
    networkConditions: {
      gasPrice: 60,
      networkLatency: 120,
      blockTime: 18,
      confirmationBlocks: 15
    },
    profitThreshold: 0.02,
    volatility: 0.5,
    dexMultiplier: 1
  },
  {
    name: 'DEX Premium',
    networkConditions: {
      gasPrice: 55,
      networkLatency: 110,
      blockTime: 16,
      confirmationBlocks: 13
    },
    profitThreshold: 0.015,
    volatility: 0.2,
    dexMultiplier: 1.05
  },
  {
    name: 'DEX Discount',
    networkConditions: {
      gasPrice: 45,
      networkLatency: 90,
      blockTime: 14,
      confirmationBlocks: 11
    },
    profitThreshold: 0.005,
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
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : currentScenario.name === scenario.name
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{scenario.name}</h3>
                              </div>
              <PlayCircle className={`${currentScenario.name === scenario.name ? 'text-blue-500' : 'text-gray-400'}`} />
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
