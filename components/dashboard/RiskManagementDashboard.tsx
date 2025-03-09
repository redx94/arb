import React, { useState, Dispatch, SetStateAction } from 'react';
import { RiskManagement } from './RiskManagement';
import { RiskManager } from '../../utils/riskManager';

interface RiskManagementDashboardProps {
}

const RiskManagementDashboard: React.FC<RiskManagementDashboardProps> = () => {
  const [maxDrawdown, setMaxDrawdown] = useState<number>(20); // 20%
  const [positionLimit, setPositionLimit] = useState<number>(5); // 5 ETH
  const [stopLoss, setStopLoss] = useState<number>(2); // 2%
  const [emergencyShutdown, setEmergencyShutdown] = useState<boolean>(false);

  const simulateTradingEngine = (maxDrawdown: number, positionLimit: number, stopLoss: number, emergencyShutdown: boolean) => {
    // This is a placeholder function to simulate the trading engine
    // In a real implementation, this function would execute the trading logic
    // and enforce the risk management parameters
    const riskManager = new RiskManager(maxDrawdown, positionLimit, stopLoss, emergencyShutdown);
    console.log('Risk parameters updated:', { maxDrawdown, positionLimit, stopLoss, emergencyShutdown });
    console.log('RiskManager instance:', riskManager);
    // Simulate a trade
    const tradeData = {
      cex: 2000,
      dex: 1900,
      amount: 10,
      portfolioValue: 1000,
      initialPortfolioValue: 1200,
      positionSize: 6,
      currentPrice: 1950,
      entryPrice: 2000,
    };

    try {
      riskManager.validateTrade(tradeData);
      console.log('Trade validated successfully.');
    } catch (error: any) {
      console.error('Trade validation failed:', error.message);
    }
  };

  return (
    <div className="bg-gray-50 border rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Risk Management</h2>
      <RiskManagement
        maxDrawdown={maxDrawdown}
        setMaxDrawdown={setMaxDrawdown}
        positionLimit={positionLimit}
        setPositionLimit={setPositionLimit}
        stopLoss={stopLoss}
        setStopLoss={setStopLoss}
        emergencyShutdown={emergencyShutdown}
        setEmergencyShutdown={setEmergencyShutdown}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={() => simulateTradingEngine(maxDrawdown, positionLimit, stopLoss, emergencyShutdown)}
      >
        Simulate Trading Engine
      </button>
    </div>
  );
};

export default RiskManagementDashboard;
