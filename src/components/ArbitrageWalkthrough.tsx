import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    title: 'Identify Price Difference',
    description: 'Monitor DEX and CEX prices for significant disparities that exceed gas costs.'
  },
  {
    title: 'Calculate Profit Potential',
    description: 'Factor in transaction fees, slippage, and potential MEV risks.'
  },
  {
    title: 'Execute Trades',
    description: 'Place simultaneous orders on both platforms to capture the price difference.'
  },
  {
    title: 'Monitor Settlement',
    description: 'Ensure both trades complete successfully and verify profit.'
  }
];

export const ArbitrageWalkthrough: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">How Arbitrage Works</h2>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              {index + 1}
            </div>
            <div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="mt-2 flex justify-center">
                  <ArrowRight className="text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          Pro Tip: Always ensure your trading strategy accounts for potential slippage and network congestion.
        </p>
      </div>
    </div>
  );
};