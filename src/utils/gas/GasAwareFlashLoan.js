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
var ethers_1 = require("ethers");
var GasOptimizer_js_1 = require("./GasOptimizer.js");
var monitoring_js_1 = require("../monitoring.js");
var aaveIntegration_js_1 = require("../protocols/aaveIntegration.js");
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
                        expectedProfit = ethers_1.ethers.parseEther(params.expectedProfit);
                        return [4 /*yield*/, this.gasOptimizer.calculateOptimalGasStrategy(expectedProfit, this.determineComplexity(params))];
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
        var amount = ethers_1.ethers.parseEther(params.amount);
        // Determine complexity using native BigInt comparisons
        if (amount > ethers_1.ethers.parseEther('1000')) {
            return 'high';
        }
        if (amount > ethers_1.ethers.parseEther('100')) {
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
            return "Profit margin too low. Need additional $".concat(ethers_1.ethers.formatEther(requiredProfitIncrease), " in profit for viability.");
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
                                    return [2 /*return*/, this.gasOptimizer.calculateOptimalGasStrategy(ethers_1.ethers.parseEther(op.expectedProfit), this.determineComplexity(op))];
                                });
                            }); }))];
                    case 1:
                        individualGasEstimates = _a.sent();
                        totalIndividualGas = individualGasEstimates.reduce(function (sum, strategy) { return sum + BigInt(strategy.gasLimit); }, BigInt(0));
                        return [4 /*yield*/, this.gasOptimizer.calculateOptimalGasStrategy(ethers_1.ethers.parseEther(operations[0].expectedProfit), this.determineComplexity(operations[0]))];
                    case 2:
                        batchedGasStrategy = _a.sent();
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
            var providerUrl, flashLoanContractAddress, privateKey, provider, wallet, aaveIntegration, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        providerUrl = process.env.PROVIDER_URL;
                        flashLoanContractAddress = process.env.FLASH_LOAN_CONTRACT_ADDRESS;
                        privateKey = process.env.PRIVATE_KEY;
                        if (!providerUrl || !flashLoanContractAddress || !privateKey) {
                            throw new Error('Missing provider URL, flash loan contract address, or private key');
                        }
                        provider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
                        wallet = new ethers_1.ethers.Wallet(privateKey, provider);
                        aaveIntegration = new aaveIntegration_js_1.AaveIntegration();
                        return [4 /*yield*/, aaveIntegration.executeFlashLoan(params.token, params.amount, wallet.address, // Use the wallet address as the receiver
                            '' // Replace with the actual parameters for the flash loan
                            )];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                            if (result.txHash) {
                                logger.info("Flash loan executed successfully: txHash=".concat(result.txHash));
                                console.log("Flash loan executed successfully: txHash=".concat(result.txHash));
                                return [2 /*return*/, result.txHash];
                            }
                            else {
                                logger.error('Flash loan execution failed: txHash is undefined', new Error('Flash loan execution failed: txHash is undefined'));
                                console.error('Flash loan execution failed: txHash is undefined');
                                throw new Error('Flash loan execution failed: txHash is undefined');
                            }
                        }
                        else {
                            if (result.error) {
                                logger.error('Flash loan execution failed:', new Error(result.error), params);
                                console.error('Flash loan execution failed:', result.error);
                                throw new Error(String(result.error));
                            }
                            else {
                                logger.error('Flash loan execution failed:', new Error('Unknown error'), params);
                                console.error('Flash loan execution failed: Unknown error');
                                throw new Error('Unknown error');
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger.error('Flash loan execution failed:', error_3 instanceof Error ? error_3 : new Error(String(error_3)), params);
                        console.error('Flash loan execution failed:', error_3.message);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return GasAwareFlashLoanProvider;
}());
exports.GasAwareFlashLoanProvider = GasAwareFlashLoanProvider;
