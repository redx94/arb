import React from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { TradeHistory } from './TradeHistory';
import type { ArbitrageOpportunity } from '../../types';

export const Dashboard: React.FC = () => {
  // Stub: You may connect state or context here as needed.
  const dummyOpportunities: ArbitrageOpportunity[] = []; // Replace with actual data
  return (
    <div className="p-8 space-y-8">
      <ArbitrageVisualizer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ArbitrageOpportunities opportunities={dummyOpportunities} />
        <TradeHistory />
      </div>
    </div>
  );
};
