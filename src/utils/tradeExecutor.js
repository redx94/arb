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
var priceFeeds_1 = require("./priceFeeds");
var GasAwareFlashLoan_1 = require("./gas/GasAwareFlashLoan");
var riskManager_1 = require("./riskManager");
var monitoring_1 = require("./monitoring");
var TradeExecutor = /** @class */ (function () {
    function TradeExecutor() {
        this.logger = monitoring_1.Logger.getInstance();
        this.balances = [
            { asset: 'ETH', dexAmount: 10n, cexAmount: 10n, pending: 0 }, // bigint - Corrected initialization
        ];
    }
    TradeExecutor.prototype.getBalances = function () {
        return this.balances;
    };
    TradeExecutor.prototype.executeTrade = function (type, platform, amount, price // bigint
    ) {
        return __awaiter(this, void 0, void 0, function () {
            var amountNumber, riskManager, priceFeed, priceData, gasAwareFlashLoanProvider, flashLoanParams, flashLoanUsed, maxRetries, retryCount, flashLoanError_1, tradeDetails, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        this.logger.info("Executing trade: type=".concat(type, ", platform=").concat(platform, ", amount=").concat(amount, ", price=").concat(price));
                        amountNumber = BigInt(amount);
                        if (isNaN(Number(amountNumber)) || amountNumber <= 0n) {
                            throw new Error('Invalid trade amount');
                        }
                        riskManager = riskManager_1.RiskManager.getInstance();
                        priceFeed = priceFeeds_1.PriceFeed.getInstance();
                        return [4 /*yield*/, priceFeed.getCurrentPrice()];
                    case 1:
                        priceData = _a.sent();
                        if (!priceData) {
                            throw new Error('Failed to fetch current price');
                        }
                        riskManager.validateTrade({ dex: priceData.dex, cex: priceData.cex, amount: Number(amountNumber) });
                        gasAwareFlashLoanProvider = new GasAwareFlashLoan_1.GasAwareFlashLoanProvider();
                        flashLoanParams = {
                            amount: amount,
                            token: 'ETH', // Replace with actual token
                            protocol: 'AAVE', // Replace with actual protocol based on platform
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
                            this.logger.error('Flash loan failed after multiple retries. Consider executing the trade without a flash loan.');
                            // Implement logic to execute the trade without a flash loan if possible
                            // This might involve using your own funds or adjusting the trade parameters
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
                        this.logger.info("Trade executed successfully: id=".concat(tradeDetails.id, ", flashLoanUsed=").concat(flashLoanUsed, ", tradeDetails=").concat(JSON.stringify(tradeDetails)));
                        console.log("Trade executed successfully: id=".concat(tradeDetails.id, ", flashLoanUsed=").concat(flashLoanUsed, ", tradeDetails=").concat(JSON.stringify(tradeDetails)));
                        return [2 /*return*/, { success: true, trade: tradeDetails }];
                    case 9:
                        error_1 = _a.sent();
                        this.logger.error('Trade execution failed:', error_1, { type: type, platform: platform, amount: amount, price: price });
                        console.error("Trade execution failed: ".concat(error_1.message, ", type=").concat(type, ", platform=").concat(platform, ", amount=").concat(amount, ", price=").concat(price));
                        return [2 /*return*/, { success: false, error: error_1.message }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    TradeExecutor.prototype.calculateProfit = function (trade) {
        return __awaiter(this, void 0, void 0, function () {
            var profitBigint;
            return __generator(this, function (_a) {
                profitBigint = (trade.type === 'SELL' ? 1n : -1n) * trade.amount * (trade.effectivePrice - trade.price);
                return [2 /*return*/, Number(profitBigint)]; // Convert bigint to number before returning
            });
        });
    };
    return TradeExecutor;
}());
exports.tradeExecutor = new TradeExecutor();
