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
exports.GasAwareFlashLoanProvider = void 0;
// @ts-nocheck
var ethers = require("ethers");
var GasOptimizer_js_1 = require("./GasOptimizer.js");
var monitoring_js_1 = require("../monitoring.js");
var logger = monitoring_js_1.Logger.getInstance();
var GasAwareFlashLoanProvider = /** @class */ (function () {
    function GasAwareFlashLoanProvider() {
        this.MIN_PROFIT_THRESHOLD = parseFloat(process.env.MIN_PROFIT_THRESHOLD_GAS_AWARE || '0.02'); // 2% minimum profit after gas
        this.gasOptimizer = GasOptimizer_js_1.GasOptimizer.getInstance();
    }
    GasAwareFlashLoanProvider.prototype.validateAndOptimize = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var expectedProfit, gasStrategy, totalGasCost, netProfit, profitMargin, isViable, recommendation, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        expectedProfit = ethers.ethers.parseEther(params.expectedProfit);
                        return [4 /*yield*/, this.gasOptimizer.calculateOptimalGasStrategy(BigInt(expectedProfit), this.determineComplexity(params))];
                    case 1:
                        gasStrategy = _a.sent();
                        totalGasCost = BigInt(gasStrategy.baseGas) +
                            BigInt(gasStrategy.priorityFee) * BigInt(gasStrategy.gasLimit);
                        netProfit = BigInt(expectedProfit) - totalGasCost;
                        profitMargin = Number(netProfit) / Number(expectedProfit);
                        isViable = profitMargin >= this.MIN_PROFIT_THRESHOLD;
                        recommendation = '';
                        if (!isViable) {
                            recommendation = this.generateOptimizationRecommendation(profitMargin, expectedProfit);
                        }
                        return [2 /*return*/, {
                                isViable: isViable,
                                optimizedGas: totalGasCost,
                                expectedProfit: netProfit,
                                recommendation: recommendation
                            }];
                    case 2:
                        error_1 = _a.sent();
                        logger.error('Failed to validate and optimize flash loan:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GasAwareFlashLoanProvider.prototype.determineComplexity = function (params) {
        var amount = ethers.ethers.parseEther(params.amount);
        // Determine complexity using native BigInt comparisons
        if (amount > ethers.ethers.parseEther('1000')) {
            return 'high';
        }
        if (amount > ethers.ethers.parseEther('100')) {
            return 'medium';
        }
        return 'low';
    };
    GasAwareFlashLoanProvider.prototype.generateOptimizationRecommendation = function (profitMargin, expectedProfit) {
        if (profitMargin < 0) {
            return 'Transaction would result in a loss due to gas costs. Consider increasing trade size or waiting for lower gas prices.';
        }
        if (profitMargin < this.MIN_PROFIT_THRESHOLD) {
            var requiredProfitIncrease = Number(expectedProfit) * (this.MIN_PROFIT_THRESHOLD - profitMargin);
            return "Profit margin too low. Need additional $".concat(ethers.ethers.formatEther(requiredProfitIncrease), " in profit for viability.");
        }
        return 'Consider batching multiple operations to share gas costs.';
    };
    GasAwareFlashLoanProvider.prototype._ensureReturn = function () {
        return '';
    };
    GasAwareFlashLoanProvider.prototype.batchTransactions = function (operations) {
        return __awaiter(this, void 0, void 0, function () {
            var individualGasEstimates, totalIndividualGas, batchedGasStrategy, savings, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.all(operations.map(function (op) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.gasOptimizer.calculateOptimalGasStrategy(ethers.ethers.parseEther(op.expectedProfit), this.determineComplexity(op))];
                                });
                            }); }))];
                    case 1:
                        individualGasEstimates = _a.sent();
                        totalIndividualGas = individualGasEstimates.reduce(function (sum, strategy) { return sum + BigInt(strategy.gasLimit); }, BigInt(0));
                        return [4 /*yield*/, this.gasOptimizer.calculateOptimalGasStrategy(ethers.ethers.parseEther(operations[0].expectedProfit), this.determineComplexity(operations[0]))];
                    case 2:
                        batchedGasStrategy = _a.sent();
                        ;
                        savings = totalIndividualGas - BigInt(batchedGasStrategy.gasLimit);
                        return [2 /*return*/, {
                                batchedGas: BigInt(batchedGasStrategy.gasLimit),
                                individualGas: totalIndividualGas,
                                savings: savings
                            }];
                    case 3:
                        error_2 = _a.sent();
                        logger.error('Failed to calculate batch savings:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GasAwareFlashLoanProvider.prototype.executeFlashLoan = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var providerUrl, privateKey, zeroCapitalArbTraderAddress, provider, wallet, zeroCapitalArbTrader, tx, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        providerUrl = process.env.PROVIDER_URL;
                        privateKey = process.env.PRIVATE_KEY;
                        zeroCapitalArbTraderAddress = process.env.ZERO_CAPITAL_ARB_TRADER_ADDRESS;
                        logger.info("Executing zero-capital flash loan via ZeroCapitalArbTrader: token=".concat(params.token, ", amount=").concat(params.amount, ", protocol=").concat(params.protocol));
                        if (!providerUrl || !zeroCapitalArbTraderAddress || !privateKey) {
                            logger.error("Missing configuration: providerUrl=".concat(providerUrl, ", zeroCapitalArbTraderAddress=").concat(zeroCapitalArbTraderAddress, ", privateKey=").concat(privateKey));
                            throw new Error('Missing provider URL, ZeroCapitalArbTrader contract address, or private key');
                        }
                        provider = new ethers.ethers.JsonRpcProvider(providerUrl);
                        wallet = new ethers.ethers.Wallet(privateKey, provider);
                        zeroCapitalArbTrader = new ethers.Contract(zeroCapitalArbTraderAddress, ['function requestFlashLoan(address asset, uint256 amount) external'], // ABI for requestFlashLoan
                        wallet);
                        return [4 /*yield*/, zeroCapitalArbTrader.requestFlashLoan(params.token, ethers.ethers.parseEther(params.amount))];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        _a.sent();
                        logger.info("ZeroCapitalArbTrader flash loan initiated successfully: txHash=".concat(tx.hash));
                        console.log("ZeroCapitalArbTrader flash loan initiated successfully: txHash=".concat(tx.hash));
                        return [2 /*return*/, tx.hash];
                    case 3:
                        error_3 = _a.sent();
                        logger.error('ZeroCapitalArbTrader flash loan execution failed:', error_3 instanceof Error ? error_3 : new Error(String(error_3)), params);
                        console.error('ZeroCapitalArbTrader flash loan execution failed:', error_3.message);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GasAwareFlashLoanProvider;
}());
exports.GasAwareFlashLoanProvider = GasAwareFlashLoanProvider;
