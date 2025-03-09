"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasOptimizer = void 0;
var monitoring_js_1 = require("../monitoring.cjs");
var cacheManager_js_1 = require("../cache/cacheManager.js");
var index_js_1 = require("../config/index.js");
var GasOptimizer = /** @class */ (function () {
    function GasOptimizer() {
        this.HISTORY_WINDOW = parseInt(process.env.GAS_HISTORY_WINDOW || '1000'); // Default: 1000 blocks
        this.MIN_PROFIT_MARGIN = parseFloat(process.env.GAS_MIN_PROFIT_MARGIN || '0.02'); // Default: 0.02 (2%)
        this.MAX_PRIORITY_FEE = BigInt(process.env.GAS_MAX_PRIORITY_FEE || '3000000000'); // Default: 3 gwei
        this.BASE_GAS_LIMIT = BigInt(process.env.GAS_BASE_GAS_LIMIT || '300000'); // Default: 300000
        this.gasHistory = new cacheManager_js_1.CacheManager({ ttl: 3600000 });
        this.startGasMonitoring();
    }
    GasOptimizer.getInstance = function () {
        if (!GasOptimizer.instance) {
            GasOptimizer.instance = new GasOptimizer();
        }
        return GasOptimizer.instance;
    };
    GasOptimizer.estimateGasCost = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, estimatedGas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        provider = index_js_1.configManager.getProvider();
                        return [4 /*yield*/, provider.estimateGas(tx)];
                    case 1:
                        estimatedGas = _a.sent();
                        return [2 /*return*/, estimatedGas];
                }
            });
        });
    };
    GasOptimizer.prototype.startGasMonitoring = function () {
        return __awaiter(this, void 0, void 0, function () {
            var provider_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    provider_1 = index_js_1.configManager.getProvider();
                    provider_1.on('block', function (blockNumber) { return __awaiter(_this, void 0, void 0, function () {
                        var feeData, timestamp;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, provider_1.getFeeData()];
                                case 1:
                                    feeData = _a.sent();
                                    timestamp = Date.now();
                                    if (feeData.gasPrice) {
                                        this.gasHistory.set(blockNumber.toString(), {
                                            timestamp: timestamp,
                                            baseGas: Number(feeData.gasPrice),
                                            priorityFee: feeData.maxPriorityFeePerGas != null ? Number(feeData.maxPriorityFeePerGas) : 0,
                                            blockNumber: Number(blockNumber)
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
                catch (error) {
                    monitoring_js_1.Logger.getInstance().error('Failed to start gas monitoring:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    GasOptimizer.prototype.calculateOptimalGasStrategy = function (expectedProfit_1) {
        return __awaiter(this, arguments, void 0, function (expectedProfit, complexity) {
            var gasStats, baseGas, priorityFee, gasLimit, waitBlocks, totalGasCost, minProfit, error_1;
            if (complexity === void 0) { complexity = 'medium'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.analyzeGasHistory()];
                    case 1:
                        gasStats = _a.sent();
                        baseGas = this.calculateBaseGas(gasStats);
                        priorityFee = this.calculatePriorityFee(gasStats, expectedProfit);
                        gasLimit = this.calculateGasLimit(complexity);
                        waitBlocks = this.determineWaitBlocks(gasStats);
                        totalGasCost = (baseGas + priorityFee) * gasLimit;
                        minProfit = (expectedProfit * BigInt(Math.floor(this.MIN_PROFIT_MARGIN * 1e6))) / 1000000n;
                        if (totalGasCost > minProfit) {
                            throw new Error('Gas costs exceed minimum profit threshold');
                        }
                        return [2 /*return*/, { baseGas: baseGas, priorityFee: priorityFee, gasLimit: gasLimit, waitBlocks: waitBlocks }];
                    case 2:
                        error_1 = _a.sent();
                        monitoring_js_1.Logger.getInstance().error('Failed to calculate optimal gas strategy:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GasOptimizer.prototype.analyzeGasHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entries, recentHistory, median, percentile90, trend, volatility;
            return __generator(this, function (_a) {
                entries = Array.from(this.gasHistory.getAll());
                if (entries.length === 0)
                    return [2 /*return*/, { median: 0, percentile90: 0, trend: 'stable', volatility: 0 }];
                recentHistory = entries
                    .slice(-this.HISTORY_WINDOW)
                    .map(function (data) { return data.baseGas; })
                    .sort(function (a, b) { return a - b; });
                median = recentHistory[Math.floor(recentHistory.length / 2)] || 0;
                percentile90 = recentHistory[Math.floor(recentHistory.length * 0.9)] || 0;
                trend = this.calculateTrend(recentHistory);
                volatility = this.calculateVolatility(recentHistory);
                return [2 /*return*/, { median: median, percentile90: percentile90, trend: trend, volatility: volatility }];
            });
        });
    };
    GasOptimizer.prototype.calculateTrend = function (history) {
        if (history.length < 4)
            return 'stable';
        var firstQuarter = history.slice(0, Math.floor(history.length / 4));
        var lastQuarter = history.slice(-Math.floor(history.length / 4));
        var firstAvg = firstQuarter.reduce(function (a, b) { return a + b; }, 0) / firstQuarter.length;
        var lastAvg = lastQuarter.reduce(function (a, b) { return a + b; }, 0) / lastQuarter.length;
        return lastAvg > firstAvg ? 'increasing' : lastAvg < firstAvg ? 'decreasing' : 'stable';
    };
    GasOptimizer.prototype.calculateVolatility = function (history) {
        if (history.length < 2)
            return 0;
        var mean = history.reduce(function (a, b) { return a + b; }, 0) / history.length;
        return Math.sqrt(history.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / history.length);
    };
    GasOptimizer.prototype.calculateBaseGas = function (gasStats) {
        var baseGas = BigInt(Math.floor(gasStats.median));
        if (gasStats.trend === 'increasing') {
            baseGas += baseGas * 10n / 100n;
        }
        return baseGas + (baseGas * BigInt(Math.ceil(gasStats.volatility * 100)) / 1000n);
    };
    GasOptimizer.prototype.calculatePriorityFee = function (gasStats, expectedProfit) {
        var priorityFee = BigInt(Math.floor(gasStats.median / 10));
        var profitBasedFee = expectedProfit * 5n / 1000n; // 0.5% of expected profit
        priorityFee += profitBasedFee;
        // Adjust priority fee based on network conditions
        if (gasStats.percentile90 > gasStats.median * 2) {
            // Network is congested, increase priority fee
            priorityFee += BigInt(Math.floor(gasStats.percentile90 / 20)); // Add 5% of percentile90
        }
        return priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee;
    };
    GasOptimizer.prototype.calculateGasLimit = function (complexity) {
        var multiplier = { low: 1, medium: 2, high: 3 }[complexity];
        return this.BASE_GAS_LIMIT * BigInt(multiplier);
    };
    GasOptimizer.prototype.determineWaitBlocks = function (gasStats) {
        var trend = gasStats.trend;
        return { decreasing: 1, stable: 2, increasing: 3 }[trend];
    };
    return GasOptimizer;
}());
exports.GasOptimizer = GasOptimizer;
