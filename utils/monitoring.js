export class PerformanceMonitor {
    constructor() {
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "METRICS_HISTORY_LIMIT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    startTimer(label) {
        performance.mark(`${label}-start`);
    }
    endTimer(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        const duration = performance.getEntriesByName(label)[0].duration;
        this.recordMetric(label, duration);
        return duration;
    }
    recordMetric(name, value) {
        const values = this.metrics.get(name) || [];
        values.push(value);
        if (values.length > this.METRICS_HISTORY_LIMIT) {
            values.shift();
        }
        this.metrics.set(name, values);
    }
    getMetrics(name) {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            avg: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }
    clearMetrics() {
        this.metrics.clear();
        performance.clearMarks();
        performance.clearMeasures();
    }
}
export class Logger {
    constructor() {
        Object.defineProperty(this, "logBuffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "BUFFER_SIZE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    formatMessage(level, message, meta) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta
        });
    }
    info(message, meta) {
        const formattedMessage = this.formatMessage('info', message, meta);
        console.log(formattedMessage);
        this.bufferLog({ level: 'info', message, meta, timestamp: new Date() });
    }
    error(message, error, meta) {
        const formattedMessage = this.formatMessage('error', message, {
            error: error?.message,
            stack: error?.stack,
            ...meta
        });
        console.error(formattedMessage);
        this.bufferLog({ level: 'error', message, meta: { error: error?.message, stack: error?.stack, ...meta }, timestamp: new Date() });
    }
    warn(message, meta) {
        const formattedMessage = this.formatMessage('warn', message, meta);
        console.warn(formattedMessage);
        this.bufferLog({ level: 'warn', message, meta, timestamp: new Date() });
    }
    bufferLog(log) {
        this.logBuffer.push({ ...log, timestamp: new Date() });
        if (this.logBuffer.length > this.BUFFER_SIZE) {
            this.logBuffer.shift();
        }
    }
    getLogs() {
        return [...this.logBuffer];
    }
    clearLogs() {
        this.logBuffer = [];
    }
}
