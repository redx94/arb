import React, { useState } from 'react';
import { LineChart } from './LineChart.js';
import { PriceDisplay } from './PriceDisplay.js';
import { ScenarioLoader } from './ScenarioLoader.js';
import { MevRiskMatrix } from './MevRiskMatrix.js';
import { ArbitrageWalkthrough } from './ArbitrageWalkthrough.js';
import { TradeExecutor } from './TradeExecutor.js';
import { PriceData, SimulationScenario } from '../types/index.js';

interface ArbitrageVisualizerProps {
  useMockData: boolean;
  setUseMockData: (useMockData: boolean) => void;
  priceHistory: PriceData[];
}

export const ArbitrageVisualizer: React.FC<ArbitrageVisualizerProps> = ({ useMockData, setUseMockData, priceHistory }) => {
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>({
    name: 'Normal Market',
    description: 'Normal market conditions',
    networkConditions: {
      latency: 50,
      gasPrice: 20,
      blockConfirmationTime: 5,
      networkCongestion: 0.1,
      networkLatency: 100,
      blockTime: 10
    },
    assets: [],
    duration: 60,
    riskThreshold: 0.5
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setUseMockData(!useMockData)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {useMockData ? 'Switch to Live Data' : 'Switch to Mock Data'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceDisplay latestPrice={priceHistory[priceHistory.length - 1]} />
        <ScenarioLoader onScenarioChange={setCurrentScenario} currentScenario={currentScenario} disabled={!useMockData} />
      </div>
      <LineChart data={priceHistory} />
      <TradeExecutor />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MevRiskMatrix />
        <ArbitrageWalkthrough />
      </div>
    </div>
  );
};
