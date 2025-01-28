import React from 'react';
import { Activity, AlertTriangle, TrendingUp, Settings, PieChart, Clock, Zap, Shield } from 'lucide-react';
import { SystemStatus } from './SystemStatus';
import { TradingControls } from './TradingControls';
import { RiskManagement } from './RiskManagement';
import { PerformanceMetrics } from './PerformanceMetrics';
import { TradeHistory } from './TradeHistory';
import { ArbitrageOpportunities } from './ArbitrageOpportunities';
import { SystemHealth } from './SystemHealth';
import { MarketDataFeeds } from './MarketDataFeeds';
import { TransactionMonitor } from '../monitoring/TransactionMonitor';
import { useTradeStore } from '../../utils/store';

export const Dashboard: React.FC = () => {
  const trades = useTradeStore(state => state.trades);
  const priceHistory = useTradeStore(state => state.priceHistory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Activity className="mr-2 h-8 w-8 text-blue-600" />
          High-Frequency Arbitrage Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Real-time monitoring and control of arbitrage trading operations
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - System Status and Controls */}
        <div className="lg:col-span-3 space-y-6">
          <SystemStatus />
          <TradingControls />
          <RiskManagement />
        </div>

        {/* Center Column - Main Trading View */}
        <div className="lg:col-span-6 space-y-6">
          <MarketDataFeeds />
          <TransactionMonitor />
          <ArbitrageOpportunities />
          <TradeHistory trades={trades} />
        </div>

        {/* Right Column - Performance and Health */}
        <div className="lg:col-span-3 space-y-6">
          <PerformanceMetrics trades={trades} />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
};