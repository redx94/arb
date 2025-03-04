"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.PerformanceMonitor = void 0;
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = new Map();
        this.METRICS_HISTORY_LIMIT = 1000;
    }
    PerformanceMonitor.getInstance = function () {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    };
    PerformanceMonitor.prototype.startTimer = function (label) {
        performance.mark("".concat(label, "-start"));
    };
    PerformanceMonitor.prototype.endTimer = function (label) {
        performance.mark("".concat(label, "-end"));
        performance.measure(label, "".concat(label, "-start"), "".concat(label, "-end"));
        var duration = performance.getEntriesByName(label)[0].duration;
        this.recordMetric(label, duration);
        return duration;
    };
    PerformanceMonitor.prototype.recordMetric = function (name, value) {
        var values = this.metrics.get(name) || [];
        values.push(value);
        if (values.length > this.METRICS_HISTORY_LIMIT) {
            values.shift();
        }
        this.metrics.set(name, values);
    };
    PerformanceMonitor.prototype.getMetrics = function (name) {
        var values = this.metrics.get(name) || [];
        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }
        var sum = values.reduce(function (a, b) { return a + b; }, 0);
        return {
            avg: sum / values.length,
            min: Math.min.apply(Math, values),
            max: Math.max.apply(Math, values)
        };
    };
    PerformanceMonitor.prototype.clearMetrics = function () {
        this.metrics.clear();
        performance.clearMarks();
        performance.clearMeasures();
    };
    return PerformanceMonitor;
}());
exports.PerformanceMonitor = PerformanceMonitor;
var Logger = /** @class */ (function () {
    function Logger() {
        this.logBuffer = [];
        this.BUFFER_SIZE = 1000;
    }
    Logger.getInstance = function () {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    };
    Logger.prototype.formatMessage = function (level, message, meta) {
        return JSON.stringify(__assign({ timestamp: new Date().toISOString(), level: level, message: message }, meta));
    };
    Logger.prototype.info = function (message, meta) {
        var formattedMessage = this.formatMessage('info', message, meta);
        console.log(formattedMessage);
        this.bufferLog({ level: 'info', message: message, meta: meta, timestamp: new Date() });
    };
    Logger.prototype.error = function (message, error, meta) {
        var formattedMessage = this.formatMessage('error', message, __assign({ error: error === null || error === void 0 ? void 0 : error.message, stack: error === null || error === void 0 ? void 0 : error.stack }, meta));
        console.error(formattedMessage);
        this.bufferLog({ level: 'error', message: message, meta: __assign({ error: error === null || error === void 0 ? void 0 : error.message, stack: error === null || error === void 0 ? void 0 : error.stack }, meta), timestamp: new Date() });
    };
    Logger.prototype.warn = function (message, meta) {
        var formattedMessage = this.formatMessage('warn', message, meta);
        console.warn(formattedMessage);
        this.bufferLog({ level: 'warn', message: message, meta: meta, timestamp: new Date() });
    };
    Logger.prototype.bufferLog = function (log) {
        this.logBuffer.push(__assign(__assign({}, log), { timestamp: new Date() }));
        if (this.logBuffer.length > this.BUFFER_SIZE) {
            this.logBuffer.shift();
        }
    };
    Logger.prototype.getLogs = function () {
        return __spreadArray([], this.logBuffer, true);
    };
    Logger.prototype.clearLogs = function () {
        this.logBuffer = [];
    };
    return Logger;
}());
exports.Logger = Logger;
