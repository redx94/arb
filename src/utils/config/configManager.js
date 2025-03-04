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
exports.configManager = void 0;
var ethers_1 = require("ethers");
var networks_1 = require("./networks");
var protocols_1 = require("./protocols");
var wallet_1 = require("../wallet");
var ConfigManager = /** @class */ (function () {
    function ConfigManager() {
        this.config = null;
        this.providers = new Map();
    }
    ConfigManager.getInstance = function () {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    };
    ConfigManager.prototype.initialize = function () {
        return __awaiter(this, arguments, void 0, function (networkName, apiKey) {
            var network, protocols;
            if (networkName === void 0) { networkName = 'local'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        network = networks_1.networks[networkName];
                        if (!network) {
                            throw new Error("Network ".concat(networkName, " not supported"));
                        }
                        protocols = protocols_1.protocolAddresses[networkName] || protocols_1.protocolAddresses.mainnet;
                        this.config = {
                            network: network,
                            protocols: protocols,
                            fallbackProviders: [
                                'https://eth-mainnet.infura.io/v3',
                                'https://rpc.ankr.com/eth'
                            ],
                            maxRetries: 3,
                            retryDelay: 1000
                        };
                        return [4 /*yield*/, this.setupProviders(network, apiKey)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ConfigManager.prototype.setupProviders = function (network, apiKey) {
        return __awaiter(this, void 0, void 0, function () {
            var mainProvider, wsProvider, localProvider;
            return __generator(this, function (_a) {
                try {
                    mainProvider = this.createProvider(network.rpcUrl, apiKey);
                    this.providers.set('main', mainProvider);
                    // Setup WebSocket provider if available
                    if (network.wsUrl) {
                        wsProvider = this.createWebSocketProvider(network.wsUrl, apiKey);
                        this.providers.set('ws', wsProvider);
                    }
                    // Initialize wallet manager with main provider
                    wallet_1.walletManager.setProvider(network.rpcUrl, apiKey);
                }
                catch (error) {
                    console.error('Failed to setup providers:', error);
                    localProvider = new ethers_1.ethers.JsonRpcProvider('http://localhost:8545');
                    this.providers.set('main', localProvider);
                    wallet_1.walletManager.setProvider('http://localhost:8545');
                }
                return [2 /*return*/];
            });
        });
    };
    ConfigManager.prototype.createProvider = function (rpcUrl, apiKey) {
        var url = apiKey ? "".concat(rpcUrl, "/").concat(apiKey) : rpcUrl;
        return new ethers_1.ethers.JsonRpcProvider(url);
    };
    ConfigManager.prototype.createWebSocketProvider = function (wsUrl, apiKey) {
        var url = apiKey ? "".concat(wsUrl, "/").concat(apiKey) : wsUrl;
        return new ethers_1.ethers.WebSocketProvider(url);
    };
    ConfigManager.prototype.getProvider = function (type) {
        if (type === void 0) { type = 'main'; }
        var provider = this.providers.get(type);
        if (!provider) {
            throw new Error("Provider ".concat(type, " not initialized"));
        }
        return provider;
    };
    ConfigManager.prototype.getConfig = function () {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return this.config;
    };
    ConfigManager.prototype.getProtocolConfig = function () {
        if (!this.config) {
            throw new Error('Config not initialized');
        }
        return this.config.protocols;
    };
    return ConfigManager;
}());
exports.configManager = ConfigManager.getInstance();
