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
var ArbitrageEngine = /** @class */ (function (_super) {
    __extends(ArbitrageEngine, _super);
    function ArbitrageEngine() {
        var _this = _super.call(this) || this;
        _this.running = false;
        _this.logger = monitoring_js_1.Logger.getInstance();
        _this.handlePrice = function (data) { return __awaiter(_this, void 0, void 0, function () {
            var profitThreshold, dexPriceData, cexPriceData, diff, tradeAmount, dataWithAmount, dexPriceBigInt, tradeResult, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        profitThreshold = parseFloat(process.env.PROFIT_THRESHOLD || '1');
                        return [4 /*yield*/, priceFeeds_js_1.PriceFeed.getInstance().getCurrentPrice('dex')];
                    case 1:
                        dexPriceData = _b.sent();
                        return [4 /*yield*/, priceFeeds_js_1.PriceFeed.getInstance().getCurrentPrice('cex')];
                    case 2:
                        cexPriceData = _b.sent();
                        if (!dexPriceData || !cexPriceData) {
                            this.logger.error('Failed to fetch dex or cex price data.');
                            return [2 /*return*/];
                        }
                        diff = Math.abs(cexPriceData.price - dexPriceData.price) / Math.min(dexPriceData.price, cexPriceData.price) * 100;
                        if (!(diff >= profitThreshold)) return [3 /*break*/, 5];
                        console.log("Arbitrage opportunity detected: dex=".concat(dexPriceData.price, ", cex=").concat(cexPriceData.price, ", diff=").concat(diff));
                        this.logger.info("Arbitrage opportunity detected: dex=".concat(dexPriceData.price, ", cex=").concat(cexPriceData.price));
                        this.emit('arbitrageOpportunity', { dex: dexPriceData.price, cex: cexPriceData.price }); // Emit price data
                        tradeAmount = data.amount !== undefined ? String(data.amount) : '1';
                        dataWithAmount = __assign(__assign({}, data), { amount: parseFloat(tradeAmount) });
                        return [4 /*yield*/, riskManager_js_1.RiskManager.getInstance().validateTrade(dataWithAmount)];
                    case 3:
                        _b.sent();
                        dexPriceBigInt = BigInt(Math.round(dexPriceData.price));
                        return [4 /*yield*/, tradeExecutor_js_1.tradeExecutor.executeTrade('BUY', 'DEXPlatform', tradeAmount, dexPriceBigInt)];
                    case 4:
                        tradeResult = _b.sent();
                        if (tradeResult.success) {
                            this.logger.info("Trade executed successfully: id=".concat((_a = tradeResult.trade) === null || _a === void 0 ? void 0 : _a.id));
                            this.emit('tradeExecuted', tradeResult.trade);
                        }
                        else {
                            this.logger.error("Trade execution failed: ".concat(tradeResult.error));
                            this.emit('error', tradeResult.error);
                        }
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        this.logger.error('Error in handlePrice:', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                        this.emit('error', error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
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
        if (this.running)
            return;
        this.running = true;
        this.emit('started');
        priceFeeds_js_1.PriceFeed.getInstance().subscribe(this.handlePrice);
    };
    ArbitrageEngine.prototype.stop = function () {
        if (!this.running)
            return;
        this.running = false;
        this.emit('stopped');
        priceFeeds_js_1.PriceFeed.getInstance().unsubscribe(this.handlePrice);
    };
    ArbitrageEngine.prototype.isRunning = function () {
        return this.running;
    };
    return ArbitrageEngine;
}(events_1.EventEmitter));
exports.ArbitrageEngine = ArbitrageEngine;
