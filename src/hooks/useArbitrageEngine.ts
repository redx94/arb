import { useState, useEffect } from 'react';
import { ArbitrageEngine } from '../utils/arbitrage/arbitrageEngine';
import { useTradeStore } from '../utils/store';
import { Logger } from '../utils/monitoring';

const logger = Logger.getInstance();

export const useArbitrageEngine = () => {
  const [status, setStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [latency, setLatency] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const updatePriceHistory = useTradeStore(state => state.updatePriceHistory);
  const addTrade = useTradeStore(state => state.addTrade);

  const engine = ArbitrageEngine.getInstance();

  useEffect(() => {
    // Subscribe to engine events
    engine.on('started', () => setStatus('running'));
    engine.on('stopped', () => setStatus('stopped'));
    engine.on('error', (error: Error) => {
      logger.error('Arbitrage engine error:', error);
      setErrors(prev => [...prev.slice(-4), error.message]);
    });
    engine.on('warning', (warning: string) => {
      logger.warn('Arbitrage engine warning:', warning);
      setWarnings(prev => [...prev.slice(-4), warning]);
    });
    engine.on('latencyUpdate', (newLatency: number) => setLatency(newLatency));

    return () => {
      // Cleanup event listeners
      engine.off('started', () => {});
      engine.off('stopped', () => {});
      engine.off('error', () => {});
      engine.off('warning', () => {});
      engine.off('latencyUpdate', () => {});
    };
  }, []);

  const start = () => {
    try {
      engine.start();
      logger.info('Arbitrage engine started');
    } catch (error) {
      logger.error('Failed to start arbitrage engine:', error as Error);
      setErrors(prev => [...prev.slice(-4), (error as Error).message]);
    }
  };

  const stop = () => {
    try {
      engine.stop();
      logger.info('Arbitrage engine stopped');
    } catch (error) {
      logger.error('Failed to stop arbitrage engine:', error as Error);
      setErrors(prev => [...prev.slice(-4), (error as Error).message]);
    }
  };

  const resetSystem = () => {
    try {
      engine.stop();
      setErrors([]);
      setWarnings([]);
      logger.info('System reset completed');
    } catch (error) {
      logger.error('Failed to reset system:', error as Error);
      setErrors(prev => [...prev.slice(-4), (error as Error).message]);
    }
  };

  const updateSettings = (settings: any) => {
    try {
      // Update engine settings
      logger.info('Updating engine settings:', settings);
    } catch (error) {
      logger.error('Failed to update settings:', error as Error);
      setErrors(prev => [...prev.slice(-4), (error as Error).message]);
    }
  };

  return {
    status,
    latency,
    errors,
    warnings,
    isRunning: status === 'running',
    start,
    stop,
    resetSystem,
    updateSettings
  };
};