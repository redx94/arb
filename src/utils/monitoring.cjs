"use strict";

class PerformanceMonitor {
   static instance;
   metrics = new Map();
   METRICS_HISTORY_LIMIT = 1000;

  constructor() {}

   static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

   startTimer(label) {
    performance.mark(label + '-start');
  }

   endTimer(label) {
    performance.mark(label + '-end');
    performance.measure(label, label + '-start', label + '-end');
    const duration = performance.getEntriesByName(label)[0].duration;
    this.recordMetric(label, duration);
    return duration;
  }

   recordMetric(name, value) {
    var values = this.metrics.get(name) || [];
    values.push(value);
    if (values.length > this.METRICS_HISTORY_LIMIT) {
      values.shift();
    }
    this.metrics.set(name, values);
  }

   getMetrics(name) {
    var values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    var sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min.apply(Math, values),
      max: Math.max.apply(Math, values)
    };
  }

   clearMetrics() {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

class Logger {
   static instance;
   logBuffer = [];
   BUFFER_SIZE = 1000;

  constructor() {}

   static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

   formatMessage(level, message, meta) {
    return JSON.stringify(Object.assign({ timestamp: new Date().toISOString(), level: level, message: message }, meta));
  }

   generateQuantumSignature(message, meta) {
    const data = JSON.stringify({ message: message, meta: meta, timestamp: new Date().toISOString() });
    return "QuantumSignature(" + data.length + ")";
  }

   info(message, meta) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.bufferLog({ level: 'info', message: message, meta: meta });
  }

   error(message, error, meta) {
    const errorMeta = {
      error: error === null || error === void 0 ? void 0 : error.message,
      stack: error === null || error === void 0 ? void 0 : error.stack
    };

    if (meta !== null && meta !== void 0 && meta.txHash) {
      errorMeta.txHash = meta.txHash;
    }
    if (meta !== null && meta !== void 0 && meta.revertReason) {
      errorMeta.revertReason = meta.revertReason;
    }
    const formattedMessage = this.formatMessage('error', message, errorMeta);
    console.error(formattedMessage);
    this.bufferLog({ level: 'error', message: message, meta: errorMeta });
  }

   warn(message, meta) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.bufferLog({ level: 'warn', message: message, meta: meta });
  }

   bufferLog(log) {
    this.logBuffer.push(Object.assign({}, log, { timestamp: new Date() }));
    if (this.logBuffer.length > this.BUFFER_SIZE) {
      this.logBuffer.shift();
    }
    this.analyzeLogs();
  }

   analyzeLogs() {
    const errorLogs = this.logBuffer.filter(log => log.level === 'error');
    if (errorLogs.length > 5) {
      console.warn("High number of errors detected. Triggering advanced analysis...");
    }
  }

   getLogs() {
    return [...this.logBuffer];
  }

   clearLogs() {
    this.logBuffer = [];
  }
}

module.exports = { PerformanceMonitor, Logger };
