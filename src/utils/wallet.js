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
exports.walletManager = void 0;
var ethers_1 = require("ethers");
var monitoring_cjs_1 = require("./monitoring.cjs");
var WalletManager = /** @class */ (function () {
    function WalletManager() {
        this.wallets = new Map();
        this.mockMode = false; // Default to live mode for production
        this.logger = monitoring_cjs_1.Logger.getInstance();
        try {
            if (process.env.PROVIDER_URL) {
                this.provider = new ethers_1.providers.JsonRpcProvider(process.env.PROVIDER_URL);
                this.setProvider(process.env.PROVIDER_URL);
            }
            else {
                // Default to mock provider if PROVIDER_URL is not set
                this.provider = new ethers_1.providers.JsonRpcProvider('http://localhost:8545');
            }
        }
        catch (error) {
            console.warn('Failed to set provider from PROVIDER_URL using mock provider for development');
            this.provider = new ethers_1.providers.JsonRpcProvider('http://localhost:8545');
        }
    }
    WalletManager.prototype.setProvider = function (rpcUrl, apiKey) {
        try {
            var url = apiKey ? "".concat(rpcUrl, "/").concat(apiKey) : rpcUrl;
            this.provider = new ethers_1.providers.JsonRpcProvider(url);
        }
        catch (error) {
            console.warn('Using mock provider for development');
            this.provider = new ethers_1.providers.JsonRpcProvider('http://localhost:8545');
        }
    };
    WalletManager.prototype.setMockMode = function (enabled) {
        this.mockMode = enabled;
    };
    WalletManager.prototype.setLiveProvider = function (rpcUrl, apiKey) {
        try {
            var url = apiKey ? "".concat(rpcUrl, "/").concat(apiKey) : rpcUrl;
            this.provider = new ethers_1.providers.JsonRpcProvider(url);
            this.mockMode = false; // Disable mock mode when using live provider
            console.log("Live provider set to ".concat(rpcUrl));
        }
        catch (error) {
            console.error('Error setting live provider:', error);
            throw new Error('Failed to set live provider');
        }
    };
    WalletManager.prototype.generateMockHash = function () {
        return '0x' + Array.from({ length: 64 }, function () {
            return Math.floor(Math.random() * 16).toString(16);
        }).join('');
    };
    WalletManager.prototype.createWallet = function (privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, newWallet, mockWallet;
            return __generator(this, function (_a) {
                try {
                    if (privateKey) {
                        wallet = new ethers_1.ethers.Wallet(privateKey); // Create wallet from private key
                    }
                    else {
                        wallet = ethers_1.ethers.Wallet.createRandom(); // Create random wallet
                    }
                    newWallet = {
                        address: wallet.address,
                        privateKey: wallet.privateKey,
                        chainId: 1337, // Local network for development
                        network: 'mainnet'
                    };
                    this.wallets.set(newWallet.address, newWallet);
                    return [2 /*return*/, newWallet];
                }
                catch (error) {
                    console.warn('Error creating wallet, using mock wallet');
                    mockWallet = {
                        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
                        chainId: 1337,
                        network: 'mainnet'
                    };
                    this.wallets.set(mockWallet.address, mockWallet);
                    return [2 /*return*/, mockWallet];
                }
                return [2 /*return*/];
            });
        });
    };
    WalletManager.prototype.getBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var balance, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.mockMode) {
                            return [2 /*return*/, '10.0']; // Mock balance for development
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.provider.getBalance(address)];
                    case 2:
                        balance = _a.sent();
                        return [2 /*return*/, ethers_1.ethers.utils.formatEther(balance)];
                    case 3:
                        error_1 = _a.sent();
                        console.warn('Error getting balance, using mock balance');
                        return [2 /*return*/, '10.0'];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WalletManager.prototype.signTransaction = function (from, to, value, data) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, nonce, gasPrice, tx, signer, signedTx, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wallet = this.wallets.get(from);
                        if (!wallet) {
                            throw new Error('Wallet not found');
                        }
                        if (this.mockMode) {
                            // Generate mock transaction
                            return [2 /*return*/, {
                                    hash: this.generateMockHash(),
                                    from: from,
                                    to: to,
                                    value: value,
                                    gasPrice: '20000000000',
                                    gasLimit: '21000',
                                    nonce: 0,
                                    data: data,
                                    chainId: wallet.chainId
                                }];
                        }
                        return [4 /*yield*/, this.provider.getTransactionCount(from)];
                    case 1:
                        nonce = _a.sent();
                        return [4 /*yield*/, this.provider.getFeeData()];
                    case 2:
                        gasPrice = _a.sent();
                        tx = {
                            hash: '',
                            from: from,
                            to: to,
                            value: value,
                            gasPrice: gasPrice.gasPrice ? gasPrice.gasPrice.toString() : '20000000000',
                            gasLimit: '21000',
                            nonce: nonce,
                            data: data,
                            chainId: wallet.chainId
                        };
                        signer = new ethers_1.ethers.Wallet(wallet.privateKey, this.provider);
                        return [4 /*yield*/, signer.signTransaction(tx)];
                    case 3:
                        signedTx = _a.sent();
                        tx.hash = ethers_1.ethers.utils.keccak256(signedTx);
                        return [2 /*return*/, tx];
                    case 4:
                        error_2 = _a.sent();
                        console.warn('Error signing transaction:', error_2 instanceof Error ? error_2 : new Error(String(error_2)));
                        throw new Error('Failed to sign transaction');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    WalletManager.prototype.sendTransaction = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, signer, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (this.mockMode) {
                            // Simulate successful transaction in mock mode
                            return [2 /*return*/, this.generateMockHash()];
                        }
                        this.logger.info("Sending transaction: from=".concat(tx.from, ", to=").concat(tx.to, ", value=").concat(tx.value));
                        wallet = this.wallets.get(tx.from);
                        if (!wallet) {
                            this.logger.error("Wallet not found: address=".concat(tx.from));
                            throw new Error('Wallet not found');
                        }
                        signer = new ethers_1.ethers.Wallet(wallet.privateKey, this.provider);
                        return [4 /*yield*/, signer.sendTransaction(tx)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.wait()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, response.hash];
                    case 3:
                        error_3 = _a.sent();
                        console.warn('Error sending transaction:', error_3 instanceof Error ? error_3 : new Error(String(error_3)));
                        throw new Error('Failed to send transaction');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WalletManager.prototype.getWallet = function (address) {
        return this.wallets.get(address);
    };
    WalletManager.prototype.getAllWallets = function () {
        return Array.from(this.wallets.values());
    };
    return WalletManager;
}());
exports.walletManager = new WalletManager();
