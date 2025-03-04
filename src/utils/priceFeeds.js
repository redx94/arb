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
exports.PriceFeed = void 0;
var axios_1 = require("axios");
var events_1 = require("events");
var PriceFeed = /** @class */ (function (_super) {
    __extends(PriceFeed, _super);
    function PriceFeed() {
        var _this = _super.call(this) || this;
        _this.subscribers = {};
        _this.mockMode = false;
        _this.mockData = [];
        _this.apiKey = process.env.COINGECKO_API_KEY || null;
        _this.apiBaseUrl = 'https://api.coingecko.com/api/v3';
        return _this;
    }
    PriceFeed.getInstance = function () {
        if (!PriceFeed.instance) {
            PriceFeed.instance = new PriceFeed();
        }
        return PriceFeed.instance;
    };
    PriceFeed.prototype.setMockMode = function (enabled) {
        this.mockMode = enabled;
    };
    PriceFeed.prototype.subscribe = function (callback) {
        var _this = this;
        var id = Math.random().toString(36).substr(2, 9);
        this.subscribers[id] = callback;
        return function () { return delete _this.subscribers[id]; };
    };
    PriceFeed.prototype.updatePrice = function (data) {
        if (this.mockMode) {
            this.mockData.push(data);
            Object.values(this.subscribers).forEach(function (callback) { return callback(data); }); // Still notify subscribers
        }
        else {
            Object.values(this.subscribers).forEach(function (callback) { return callback(data); });
        }
    };
    PriceFeed.prototype.getMockData = function () {
        return this.mockData;
    };
    PriceFeed.prototype.unsubscribe = function (callback) {
        this.subscribers = Object.fromEntries(Object.entries(this.subscribers).filter(function (_a) {
            var func = _a[1];
            return func !== callback;
        }));
    };
    PriceFeed.prototype.getApiUrl = function (endpoint, params) {
        var url = "".concat(this.apiBaseUrl).concat(endpoint);
        var allParams = __assign({}, params);
        if (this.apiKey) {
            allParams['api_key'] = this.apiKey;
        }
        var queryParams = new URLSearchParams(allParams).toString();
        return queryParams ? "".concat(url, "?").concat(queryParams) : url;
    };
    // Consider adding methods to handle API key updates if needed, e.g., for dynamic API key management.
    // For now, API key is expected to be set as an environment variable.
    PriceFeed.prototype.getCurrentPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var apiUrl, response, errorMessage, data, price, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        apiUrl = this.getApiUrl('/simple/price', { ids: 'ethereum', vs_currencies: 'usd' });
                        console.log('Fetching price from CoinGecko API:', apiUrl);
                        return [4 /*yield*/, axios_1.default.get(apiUrl, {
                            // Future: Authentication headers can be added here if needed.
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('CoinGecko API response:', response.data);
                        if (!response.data || !response.data.ethereum || !response.data.ethereum.usd) {
                            errorMessage = 'Invalid response format from CoinGecko API';
                            console.error(errorMessage, 'Response data:', response.data); // Include response data in error log
                            this.emit('error', errorMessage, response.data);
                            return [2 /*return*/, null];
                        }
                        data = response.data.ethereum;
                        price = data.usd;
                        return [2 /*return*/, {
                                token: 'ETH',
                                price: price,
                                dex: price,
                                cex: price,
                                timestamp: Date.now(),
                                amount: 1,
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to fetch price from CoinGecko API:', error_1);
                        this.emit('error', 'Failed to fetch price from CoinGecko API', error_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PriceFeed;
}(events_1.EventEmitter));
exports.PriceFeed = PriceFeed;
// Future improvements:
// 1. Implement authentication handling for APIs that require it.
//    - This could involve adding methods to set and manage API keys or tokens.
//    - Consider using a dedicated API client for handling authentication logic.
// 2. Add more comprehensive error handling and logging throughout the application.
//    - Implement centralized error handling and logging mechanisms.
//    - Provide more context in error messages and logs for easier debugging.
// 3. Implement more robust input validation and data sanitization.
//    - Validate inputs to prevent unexpected issues and security vulnerabilities.
// 4. Add unit and integration tests.
//    - Write tests to cover different parts of the codebase and ensure functionality.
// Example usage:
// const priceFeed = PriceFeed.getInstance();
// priceFeed.on('error', (message, error) => {
//   console.error('PriceFeed Error:', message, error);
// });
// priceFeed.subscribe((data) => {
//   console.log('Price Update:', data);
// });
// priceFeed.getCurrentPrice().then(price => {
//   console.log('Current Price:', price);
// });
