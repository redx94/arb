"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useArbitrageEngine = void 0;
const react_1 = require("react");
const arbitrageEngine_1 = require("../utils/arbitrage/arbitrageEngine");
const monitoring_1 = require("../utils/monitoring");
const logger = monitoring_1.Logger.getInstance();
const useArbitrageEngine = () => {
    const [status, setStatus] = (0, react_1.useState)('stopped');
    const [latency, setLatency] = (0, react_1.useState)(0);
    const [errors, setErrors] = (0, react_1.useState)([]);
    const [warnings, setWarnings] = (0, react_1.useState)([]);
    const engine = arbitrageEngine_1.ArbitrageEngine.getInstance();
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
    (0, react_1.useEffect)(() => {
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
exports.useArbitrageEngine = useArbitrageEngine;
