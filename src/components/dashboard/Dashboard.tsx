import React from 'react';
import { ArbitrageVisualizer } from '../ArbitrageVisualizer';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { TradeHistory } from './TradeHistory';
export const Dashboard: React.FC = () => {
  // Stub: You may connect state or context here as needed.
  return (
    <div className="p-8 space-y-8">
      <ArbitrageVisualizer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ArbitrageOpportunities opportunities={[]} />
        <TradeHistory />
      </div>
    </div>
  );
};
