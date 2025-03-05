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
exports.tradeExecutor = void 0;
var priceFeeds_js_1 = require("./priceFeeds.js");
var GasAwareFlashLoan_js_1 = require("./gas/GasAwareFlashLoan.js");
var riskManager_js_1 = require("./riskManager.js");
var monitoring_js_1 = require("./monitoring.js");
var wallet_js_1 = require("./wallet.js");
var ethers_1 = require("ethers");
var GasOptimizer_js_1 = require("./gas/GasOptimizer.js");
var TradeExecutor = /** @class */ (function () {
    function TradeExecutor() {
        this.logger = monitoring_js_1.Logger.getInstance();
        this.balances = [
            { asset: 'ETH', dexAmount: 10n, cexAmount: 10n, pending: 0n }, // bigint - Corrected initialization
        ];
        this.walletManagerInstance = wallet_js_1.walletManager; // Instantiate WalletManager
    }
    TradeExecutor.prototype.getBalances = function () {
        return this.balances;
    };
    TradeExecutor.prototype.executeTrade = function (type, platform, // Enforce 'dex' | 'cex' type
    amount, price, // bigint
    token, protocol) {
        return __awaiter(this, void 0, void 0, function () {
            var amountNumber, riskManager, priceFeed, priceData, gasAwareFlashLoanProvider, flashLoanParams, flashLoanUsed, maxRetries, retryCount, flashLoanError_1, tradeDetails, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        this.logger.info("Executing trade: type=".concat(type, ", platform=").concat(platform, ", amount=").concat(amount, ", price=").concat(price, ", token=").concat(token, ", protocol=").concat(protocol));
                        amountNumber = BigInt(amount);
                        if (isNaN(Number(amountNumber)) || amountNumber <= 0n) {
                            this.logger.error("Invalid trade amount: amount=".concat(amount));
                            throw new Error('Invalid trade amount');
                        }
                        riskManager = riskManager_js_1.RiskManager.getInstance();
                        priceFeed = priceFeeds_js_1.PriceFeed.getInstance();
                        return [4 /*yield*/, priceFeed.getCurrentPrice(platform)];
                    case 1:
                        priceData = _a.sent();
                        if (!priceData) {
                            throw new Error('Failed to fetch current price');
                        }
                        riskManager.validateTrade({ dex: Number(priceData.dex), cex: Number(priceData.cex), amount: Number(amountNumber) });
                        gasAwareFlashLoanProvider = new GasAwareFlashLoan_js_1.GasAwareFlashLoanProvider();
                        flashLoanParams = {
                            amount: amount,
                            token: token,
                            protocol: protocol,
                            expectedProfit: (amountNumber * price / 100n).toString(), // Example: 1% of trade value using bigint arithmetic
                            maxSlippage: 0.01,
                            deadline: Date.now() + 60000, // 1 minute
                        };
                        flashLoanUsed = false;
                        maxRetries = 3;
                        retryCount = 0;
                        _a.label = 2;
                    case 2:
                        if (!(retryCount < maxRetries)) return [3 /*break*/, 8];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 7]);
                        // Execute flash loan
                        return [4 /*yield*/, gasAwareFlashLoanProvider.executeFlashLoan(flashLoanParams)];
                    case 4:
                        // Execute flash loan
                        _a.sent();
                        flashLoanUsed = true;
                        return [3 /*break*/, 8]; // If flash loan succeeds, break out of the retry loop
                    case 5:
                        flashLoanError_1 = _a.sent();
                        this.logger.warn("Flash loan failed (attempt ".concat(retryCount + 1, "): ").concat(flashLoanError_1.message));
                        retryCount++;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 6:
                        _a.sent(); // Wait 1 second before retrying
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 2];
                    case 8:
                        if (!flashLoanUsed) {
                            this.logger.error('Flash loan failed after multiple retries. Trade execution aborted.');
                            return [2 /*return*/, { success: false, error: 'Flash loan failed after multiple retries. Trade execution aborted.' }];
                        }
                        tradeDetails = {
                            id: Math.random().toString(36).substring(2, 15),
                            type: type,
                            platform: platform,
                            amount: BigInt(amountNumber),
                            price: BigInt(price),
                            effectivePrice: BigInt(price),
                            profitLoss: 0n,
                            priceImpact: 0n,
                            gasCost: 0n,
                            timestamp: Date.now(),
                            status: 'COMPLETED',
                            warnings: [],
                            executedPrice: 0n,
                            slippage: 0n,
                            feeStructure: {
                                makerFee: 0n,
                                takerFee: 0n,
                            },
                        };
                        this.logger.info("Trade details: ".concat(JSON.stringify(tradeDetails)));
                        this.logger.info("Trade executed successfully: id=".concat(tradeDetails.id, ", flashLoanUsed=").concat(flashLoanUsed, ", tradeDetails=").concat(JSON.stringify(tradeDetails)));
                        console.log("Trade executed successfully: id=".concat(tradeDetails.id, ", flashLoanUsed=").concat(flashLoanUsed, ", tradeDetails=").concat(JSON.stringify(tradeDetails)));
                        // Deposit profit to wallet and allocate for future gas fees
                        return [4 /*yield*/, this.depositProfit(tradeDetails)];
                    case 9:
                        // Deposit profit to wallet and allocate for future gas fees
                        _a.sent();
                        return [2 /*return*/, { success: true, trade: tradeDetails }];
                    case 10:
                        error_1 = _a.sent();
                        this.logger.error('Trade execution failed:', error_1, {
                            type: type,
                            platform: platform,
                            amount: amount,
                            price: price,
                        });
                        console.error("Trade execution failed: ".concat(error_1.message, ", type=").concat(type, ", platform=").concat(platform, ", amount=").concat(amount, ", price=").concat(price));
                        return [2 /*return*/, { success: false, error: error_1.message }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    TradeExecutor.prototype.calculateProfit = function (trade) {
        return __awaiter(this, void 0, void 0, function () {
            var profitBigint, gasOptimizer, gasStrategy, gasCost, profitAfterGas, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        profitBigint = (trade.type === 'SELL' ? 1n : -1n) *
                            trade.amount *
                            (trade.effectivePrice - trade.price);
                        gasOptimizer = GasOptimizer_js_1.GasOptimizer.getInstance();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, gasOptimizer.calculateOptimalGasStrategy(profitBigint)];
                    case 2:
                        gasStrategy = _a.sent();
                        gasCost = BigInt(gasStrategy.baseGas) + BigInt(gasStrategy.priorityFee) * BigInt(gasStrategy.gasLimit);
                        profitAfterGas = profitBigint - gasCost;
                        return [2 /*return*/, profitAfterGas];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Error calculating gas costs:', error_2);
                        console.error('Error calculating gas costs:', error_2);
                        return [2 /*return*/, 0n]; // Return 0 if gas cost calculation fails
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TradeExecutor.prototype.depositProfit = function (tradeDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var profit, walletAddress, value, gasAllocationPercentage, gasAllocation, profitAfterGasAllocation, tx, txHash, signError_1, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.calculateProfit(tradeDetails)];
                    case 1:
                        profit = _a.sent();
                        walletAddress = process.env.WALLET_ADDRESS;
                        if (!walletAddress) {
                            this.logger.error('WALLET_ADDRESS environment variable not set.');
                            console.error('WALLET_ADDRESS environment variable not set.');
                            return [2 /*return*/];
                        }
                        if (profit <= 0n) {
                            this.logger.info('No profit to deposit.');
                            console.log('No profit to deposit.');
                            return [2 /*return*/];
                        }
                        value = ethers_1.ethers.ethers.parseEther(ethers_1.ethers.ethers.formatEther(profit));
                        gasAllocationPercentage = parseFloat(process.env.GAS_ALLOCATION_PERCENTAGE || '0.05');
                        gasAllocation = BigInt(Math.floor(Number(profit) * gasAllocationPercentage));
                        profitAfterGasAllocation = profit - gasAllocation;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.walletManagerInstance.signTransaction(walletAddress, // Use walletAddress from env variable
                            walletAddress, ethers_1.ethers.ethers.formatEther(profitAfterGasAllocation))];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, this.walletManagerInstance.sendTransaction(tx)];
                    case 4:
                        txHash = _a.sent();
                        this.logger.info("Profit deposited to wallet ".concat(walletAddress, ", TX hash: ").concat(txHash));
                        console.log("Profit deposited to wallet ".concat(walletAddress, ", TX hash: ").concat(txHash));
                        this.logger.info("Allocated ".concat(ethers_1.ethers.ethers.formatEther(gasAllocation), " ETH for future gas fees."));
                        console.log("Allocated ".concat(ethers_1.ethers.ethers.formatEther(gasAllocation), " ETH for future gas fees."));
                        return [3 /*break*/, 6];
                    case 5:
                        signError_1 = _a.sent();
                        this.logger.error('Error signing/sending transaction:', signError_1);
                        console.error('Error signing/sending transaction:', signError_1);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        this.logger.error('Error depositing profit:', error_3 instanceof Error ? error_3 : new Error(String(error_3)));
                        console.error('Error depositing profit:', error_3);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return TradeExecutor;
}());
exports.tradeExecutor = new TradeExecutor();
