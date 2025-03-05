"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ArbitrageEngine = void 0;
var events_1 = require("events");
var priceFeeds_js_1 = require("../priceFeeds.js");
var riskManager_js_1 = require("../riskManager.js");
var monitoring_js_1 = require("../monitoring.js");
var tradeExecutor_js_1 = require("../tradeExecutor.js");
var GasAwareFlashLoan_js_1 = require("../gas/GasAwareFlashLoan.js");
var ArbitrageEngine = /** @class */ (function (_super) {
    __extends(ArbitrageEngine, _super);
    function ArbitrageEngine() {
        var _this = _super.call(this) || this;
        _this.running = false;
        _this.logger = monitoring_js_1.Logger.getInstance();
        _this.unsubscribePriceFeed = null;
        _this.gasAwareFlashLoanProvider = new GasAwareFlashLoan_js_1.GasAwareFlashLoanProvider();
        _this.handlePrice = function (data) { return __awaiter(_this, void 0, void 0, function () {
            var profitThreshold, dexPriceData, cexPriceData, diff, defaultTradeAmount, tradeAmount, dataWithAmount, riskError_1, buyPlatform, sellPlatform, tradeType, priceNumber, priceBigInt, tokens, protocols, _i, tokens_1, token, _a, protocols_1, protocol, flashLoanParams, txHash, flashLoanError_1, tradeResult, tradeError_1, flashLoanError_2, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log('handlePrice: start'); // Added console log
                        this.logger.info('Handling price update...'); // Added log
                        this.logger.info("Received price data: ".concat(JSON.stringify(data))); // Log price data
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 23, , 24]);
                        profitThreshold = parseFloat(process.env.PROFIT_THRESHOLD || '1');
                        return [4 /*yield*/, priceFeeds_js_1.PriceFeed.getInstance().getCurrentPrice('dex')];
                    case 2:
                        dexPriceData = _c.sent();
                        this.logger.info("DEX price data: ".concat(JSON.stringify(dexPriceData))); // Log DEX price data
                        return [4 /*yield*/, priceFeeds_js_1.PriceFeed.getInstance().getCurrentPrice('cex')];
                    case 3:
                        cexPriceData = _c.sent();
                        this.logger.info("CEX price data: ".concat(JSON.stringify(cexPriceData))); // Log CEX price data
                        if (!dexPriceData || !cexPriceData) {
                            this.logger.error('Failed to fetch dex or cex price data.');
                            this.logger.error("dexPriceData: ".concat(JSON.stringify(dexPriceData), ", cexPriceData: ").concat(JSON.stringify(cexPriceData)));
                            return [2 /*return*/];
                        }
                        diff = Math.abs(cexPriceData.price - dexPriceData.price) / Math.min(dexPriceData.price, cexPriceData.price) * 100;
                        this.logger.info("Price difference: dex=".concat(dexPriceData.price, ", cex=").concat(cexPriceData.price, ", diff=").concat(diff));
                        console.log("dexPriceData.price: ".concat(dexPriceData.price, ", cexPriceData.price: ").concat(cexPriceData.price, ", diff: ").concat(diff));
                        if (!(diff >= profitThreshold)) return [3 /*break*/, 22];
                        console.log("Arbitrage opportunity detected: dex=".concat(dexPriceData.price, ", cex=").concat(cexPriceData.price, ", diff=").concat(diff));
                        this.logger.info("Arbitrage opportunity detected: dex=".concat(dexPriceData.price, ", cex=").concat(cexPriceData.price));
                        this.emit('arbitrageOpportunity', { dex: Number(dexPriceData.dex), cex: Number(cexPriceData.cex) }); // Emit price data
                        defaultTradeAmount = process.env.TRADE_AMOUNT || '1';
                        tradeAmount = data.amount !== undefined ? String(data.amount) : defaultTradeAmount;
                        dataWithAmount = __assign(__assign({}, data), { amount: parseFloat(tradeAmount) });
                        this.logger.info("Validating trade: dex=".concat(dexPriceData.dex, ", cex=").concat(cexPriceData.cex, ", amount=").concat(tradeAmount));
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, riskManager_js_1.RiskManager.getInstance().validateTrade({ dex: Number(Number(dexPriceData.dex)), cex: Number(Number(cexPriceData.cex)), amount: parseFloat(tradeAmount) })];
                    case 5:
                        _c.sent();
                        this.logger.info('Trade validated successfully.');
                        return [3 /*break*/, 7];
                    case 6:
                        riskError_1 = _c.sent();
                        this.logger.error("Trade validation failed: ".concat(riskError_1), riskError_1 instanceof Error ? riskError_1 : new Error(String(riskError_1)));
                        return [2 /*return*/];
                    case 7:
                        buyPlatform = dexPriceData.price < cexPriceData.price ? 'dex' : 'cex';
                        sellPlatform = dexPriceData.price < cexPriceData.price ? 'cex' : 'dex';
                        tradeType = dexPriceData.price < cexPriceData.price ? 'BUY' : 'SELL';
                        priceNumber = dexPriceData.price < cexPriceData.price ? dexPriceData.price : cexPriceData.price;
                        priceBigInt = BigInt(priceNumber);
                        tokens = (process.env.TOKENS || 'ETH,BTC').split(',');
                        protocols = (process.env.PROTOCOLS || 'AAVE').split(',');
                        _c.label = 8;
                    case 8:
                        _c.trys.push([8, 21, , 22]);
                        _i = 0, tokens_1 = tokens;
                        _c.label = 9;
                    case 9:
                        if (!(_i < tokens_1.length)) return [3 /*break*/, 20];
                        token = tokens_1[_i];
                        _a = 0, protocols_1 = protocols;
                        _c.label = 10;
                    case 10:
                        if (!(_a < protocols_1.length)) return [3 /*break*/, 19];
                        protocol = protocols_1[_a];
                        flashLoanParams = {
                            token: token, // Assuming the first token is the flash loan token
                            amount: tradeAmount,
                            expectedProfit: String(diff), // Using the price difference as the expected profit
                            deadline: Date.now() + 60000, // 1 minute deadline
                            protocol: protocol,
                            maxSlippage: 0,
                        };
                        // Execute flash loan
                        this.logger.info("Executing flash loan: token=".concat(token, ", amount=").concat(tradeAmount, ", protocol=").concat(protocol));
                        txHash = void 0;
                        _c.label = 11;
                    case 11:
                        _c.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, this.gasAwareFlashLoanProvider.executeFlashLoan(flashLoanParams)];
                    case 12:
                        txHash = _c.sent();
                        this.logger.info("Flash loan executed successfully: txHash=".concat(txHash));
                        return [3 /*break*/, 14];
                    case 13:
                        flashLoanError_1 = _c.sent();
                        this.logger.error("Flash loan execution failed for token=".concat(token, ", protocol=").concat(protocol, ": ").concat(flashLoanError_1), flashLoanError_1 instanceof Error ? flashLoanError_1 : new Error(String(flashLoanError_1)));
                        this.emit('error', flashLoanError_1);
                        return [3 /*break*/, 18]; // Skip to the next token/protocol combination
                    case 14:
                        this.logger.info("Executing trade: tradeType=".concat(tradeType, ", buyPlatform=").concat(buyPlatform, ", amount=").concat(tradeAmount, ", token=").concat(token, ", protocol=").concat(protocol));
                        tradeResult = void 0;
                        _c.label = 15;
                    case 15:
                        _c.trys.push([15, 17, , 18]);
                        return [4 /*yield*/, tradeExecutor_js_1.tradeExecutor.executeTrade(tradeType, buyPlatform, tradeAmount, priceBigInt, token, protocol)];
                    case 16:
                        tradeResult = _c.sent();
                        if (tradeResult.success) {
                            this.logger.info("Trade executed successfully: id=".concat((_b = tradeResult.trade) === null || _b === void 0 ? void 0 : _b.id, ", token=").concat(token, ", protocol=").concat(protocol));
                            this.emit('tradeExecuted', tradeResult.trade);
                        }
                        else {
                            this.logger.error("Trade execution failed for token=".concat(token, ", protocol=").concat(protocol, ": ").concat(tradeResult.error));
                            this.emit('error', tradeResult.error);
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        tradeError_1 = _c.sent();
                        this.logger.error("Trade execution failed for token=".concat(token, ", protocol=").concat(protocol, ": ").concat(tradeError_1), tradeError_1 instanceof Error ? tradeError_1 : new Error(String(tradeError_1)));
                        this.emit('error', tradeError_1);
                        return [3 /*break*/, 18];
                    case 18:
                        _a++;
                        return [3 /*break*/, 10];
                    case 19:
                        _i++;
                        return [3 /*break*/, 9];
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        flashLoanError_2 = _c.sent();
                        this.logger.error("Flash loan execution failed: ".concat(flashLoanError_2), flashLoanError_2 instanceof Error ? flashLoanError_2 : new Error(String(flashLoanError_2)));
                        this.emit('error', flashLoanError_2);
                        return [3 /*break*/, 22];
                    case 22: return [3 /*break*/, 24];
                    case 23:
                        error_1 = _c.sent();
                        this.logger.error('Error in handlePrice:', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                        this.emit('error', error_1);
                        return [3 /*break*/, 24];
                    case 24: return [2 /*return*/];
                }
            });
        }); };
        return _this;
    }
    ArbitrageEngine.getInstance = function () {
        if (!ArbitrageEngine.instance) {
            ArbitrageEngine.instance = new ArbitrageEngine();
        }
        return ArbitrageEngine.instance;
    };
    ArbitrageEngine.prototype.start = function () {
        if (this.running) {
            this.logger.info('ArbitrageEngine already running.');
            return;
        }
        this.logger.info('ArbitrageEngine starting...'); // Added log
        this.logger.info("PROFIT_THRESHOLD: ".concat(process.env.PROFIT_THRESHOLD, ", TRADE_AMOUNT: ").concat(process.env.TRADE_AMOUNT, ", TOKENS: ").concat(process.env.TOKENS, ", PROTOCOLS: ").concat(process.env.PROTOCOLS)); // Log env vars
        this.running = true;
        this.emit('started');
        this.logger.info('ArbitrageEngine started.'); // Added log
        this.unsubscribePriceFeed = priceFeeds_js_1.PriceFeed.getInstance().subscribe(this.handlePrice);
        if (this.unsubscribePriceFeed !== null) {
            this.logger.info('Subscribed to PriceFeed.'); // Added log
        }
        else {
            this.logger.error('Failed to subscribe to PriceFeed.'); // Added log
        }
    };
    ArbitrageEngine.prototype.stop = function () {
        if (!this.running)
            return;
        this.running = false;
        this.emit('stopped');
        if (this.unsubscribePriceFeed) {
            this.unsubscribePriceFeed();
            this.unsubscribePriceFeed = null;
        }
    };
    ArbitrageEngine.prototype.isRunning = function () {
        return this.running;
    };
    return ArbitrageEngine;
}(events_1.EventEmitter));
exports.ArbitrageEngine = ArbitrageEngine;
