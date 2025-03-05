import { useState, useEffect } from 'react';
import { ArbitrageEngine } from '../utils/arbitrage/arbitrageEngine.js';
import { Logger } from '../utils/monitoring.js';
import { FlashLoanProvider } from '../utils/flashLoanProvider.js';

const logger = Logger.getInstance();

export const useArbitrageEngine = () => {
  const [status, setStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [latency, setLatency] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const engine = ArbitrageEngine.getInstance();

  // Define event handlers for consistency and cleanup.
  const handleStarted = () => setStatus('running');
  const handleStopped = () => setStatus('stopped');
  const handleError = (error: Error) => {
    logger.error('Arbitrage engine error:', error);
    setErrors((prev: string[]) => [...prev.slice(-4), error.message]);
  };
  const handleWarning = (warning: string) => {
    logger.warn('Arbitrage engine warning:', warning);
    setWarnings((prev: string[]) => [...prev.slice(-4), warning]);
  };
  const handleLatencyUpdate = (newLatency: number) => setLatency(newLatency);

  useEffect(() => {
    engine.on('started', handleStarted);
    engine.on('stopped', handleStopped);
    engine.on('error', handleError);
    engine.on('warning', handleWarning);
    engine.on('latencyUpdate', handleLatencyUpdate);

    return () => {
      engine.off('started', handleStarted);
      engine.off('stopped', handleStopped);
      engine.off('error', handleError);
      engine.off('warning', handleWarning);
      engine.off('latencyUpdate', handleLatencyUpdate);
    };
  }, [engine]);

  const start = () => engine.start();
  const stop = () => engine.stop();
  const isRunning = engine.isRunning();
  const resetSystem = () => {
    engine.reset();
  };
  const updateSettings = (settings: any) => {
    if (settings.PROFIT_THRESHOLD) {
      process.env.PROFIT_THRESHOLD = settings.PROFIT_THRESHOLD;
    }
    if (settings.TRADE_AMOUNT) {
      process.env.TRADE_AMOUNT = settings.TRADE_AMOUNT;
    }
    if (settings.TOKENS) {
      process.env.TOKENS = settings.TOKENS;
    }
    if (settings.PROTOCOLS) {
      process.env.PROTOCOLS = settings.PROTOCOLS;
    }
    engine.reset();
  };

  return {
    status,
    latency,
    errors,
    warnings,
    start,
    stop,
    isRunning,
    resetSystem,
    updateSettings,
  };
};
