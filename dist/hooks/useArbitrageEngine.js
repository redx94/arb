import { useState, useEffect } from 'react';
import { ArbitrageEngine } from '../utils/arbitrage/arbitrageEngine';
import { Logger } from '../utils/monitoring';
const logger = Logger.getInstance();
export const useArbitrageEngine = () => {
    const [status, setStatus] = useState('stopped');
    const [latency, setLatency] = useState(0);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const engine = ArbitrageEngine.getInstance();
    // Define event handlers for consistency and cleanup.
    const handleStarted = () => setStatus('running');
    const handleStopped = () => setStatus('stopped');
    const handleError = (error) => {
        logger.error('Arbitrage engine error:', error);
        setErrors((prev) => [...prev.slice(-4), error.message]);
    };
    const handleWarning = (warning) => {
        logger.warn('Arbitrage engine warning:', warning);
        setWarnings((prev) => [...prev.slice(-4), warning]);
    };
    const handleLatencyUpdate = (newLatency) => setLatency(newLatency);
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
    const resetSystem = () => { };
    const updateSettings = (_settings) => { };
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
