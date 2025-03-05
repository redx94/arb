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
exports.AaveIntegration = void 0;
var ethers_1 = require("ethers");
var monitoring_js_1 = require("../monitoring.js");
var logger = monitoring_js_1.Logger.getInstance();
var AaveIntegration = /** @class */ (function () {
    function AaveIntegration() {
    }
    AaveIntegration.getInstance = function () {
        if (!AaveIntegration.instance) {
            AaveIntegration.instance = new AaveIntegration();
        }
        return AaveIntegration.instance;
    };
    AaveIntegration.prototype.getLendingRates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Get supply and borrow APY
                return [2 /*return*/, {
                        supplyAPY: 0,
                        borrowAPY: 0,
                        utilizationRate: 0,
                    }];
            });
        });
    };
    AaveIntegration.prototype.getCollateralFactor = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Get max borrowing power for collateral
                return [2 /*return*/, 0.8]; // 80% example
            });
        });
    };
    AaveIntegration.prototype.executeFlashLoan = function (token, amount, receiver) {
        return __awaiter(this, void 0, void 0, function () {
            var providerUrl, privateKey, aavePoolAddress, provider, wallet, aavePool, assets, amounts, referralCode, initiator, tx, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        providerUrl = process.env.PROVIDER_URL;
                        privateKey = process.env.PRIVATE_KEY;
                        aavePoolAddress = process.env.AAVE_POOL_ADDRESS;
                        logger.info("Executing Aave flash loan: token=".concat(token, ", amount=").concat(amount, ", receiver=").concat(receiver));
                        if (!providerUrl || !privateKey || !aavePoolAddress) {
                            logger.error("Missing configuration: providerUrl=".concat(providerUrl, ", privateKey=").concat(privateKey, ", aavePoolAddress=").concat(aavePoolAddress));
                            throw new Error('Missing provider URL, private key, or Aave Pool address');
                        }
                        provider = new ethers_1.ethers.JsonRpcProvider(providerUrl);
                        wallet = new ethers_1.ethers.Wallet(privateKey, provider);
                        aavePool = new ethers_1.ethers.Contract(aavePoolAddress, [
                            'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256 referralCode, address initiator) external',
                        ], wallet);
                        assets = [token];
                        amounts = [ethers_1.ethers.parseEther(amount)];
                        referralCode = 0;
                        initiator = wallet.address;
                        return [4 /*yield*/, aavePool.flashLoan(receiver, assets, amounts, referralCode, initiator)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        _a.sent();
                        logger.info("Aave flash loan executed successfully: txHash=".concat(tx.hash));
                        console.log("Aave flash loan executed successfully: txHash=".concat(tx.hash));
                        return [2 /*return*/, { success: true, txHash: tx.hash }];
                    case 3:
                        error_1 = _a.sent();
                        logger.error('Aave flash loan execution failed:', error_1, {
                            token: token,
                            amount: amount,
                            receiver: receiver
                        });
                        console.error('Aave flash loan execution failed:', error_1.message);
                        return [2 /*return*/, { success: false, error: error_1.message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AaveIntegration;
}());
exports.AaveIntegration = AaveIntegration;
