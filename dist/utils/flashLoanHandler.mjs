"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            }
        }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () {
            if (t[0] & 1)
                throw t[1];
            return t[1];
        }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _)
            try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashLoanHandler = void 0;
var ethers_1 = require("ethers");
var FlashLoanHandler = /** @class */ (function () {
    function FlashLoanHandler() {
        this.MIN_PROFIT_THRESHOLD = process.env.MIN_PROFIT_THRESHOLD || '0.05';
        this.MAX_GAS_PRICE = process.env.MAX_GAS_PRICE || '500';
        this.FLASH_LOAN_CONTRACT_ADDRESS = process.env.FLASH_LOAN_CONTRACT_ADDRESS || '0x794a61358D6845594F94dc1DB027E1266356b045'; // AAVE V2 FlashLoan contract address (replace with actual address)
    }
    FlashLoanHandler.getInstance = function () {
        if (!FlashLoanHandler.instance) {
            FlashLoanHandler.instance = new FlashLoanHandler();
        }
        return FlashLoanHandler.instance;
    };
    FlashLoanHandler.prototype.validateFlashLoan = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var profitBN, minProfit, gasPrice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        profitBN = ethers_1.ethers.parseUnits(params.expectedProfit, 18);
                        minProfit = ethers_1.ethers.parseUnits(this.MIN_PROFIT_THRESHOLD, 18);
                        if (profitBN < minProfit) {
                            throw new Error('Insufficient profit margin for flash loan');
                        }
                        return [4 /*yield*/, this.getCurrentGasPrice()];
                    case 1:
                        gasPrice = _a.sent();
                        if (gasPrice > ethers_1.ethers.parseUnits(this.MAX_GAS_PRICE, 'gwei')) {
                            throw new Error('Gas price too high for profitable execution');
                        }
                        // Verify deadline
                        if (params.deadline < Date.now() + 2) { // 2 blocks minimum
                            throw new Error('Deadline too close for safe execution');
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    FlashLoanHandler.prototype.executeFlashLoan = function (params_1) {
        return __awaiter(this, arguments, void 0, function (params, gasless) {
            var gasCost, amountWei, expectedProfitWei, modifiedParams, simulation, txHash, error_1;
            if (gasless === void 0) {
                gasless = true;
            }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.estimateGasCost(params)];
                    case 1:
                        gasCost = _a.sent();
                        amountWei = ethers_1.ethers.parseUnits(params.amount, 18);
                        expectedProfitWei = ethers_1.ethers.parseUnits(params.expectedProfit, 18);
                        modifiedParams = gasless ? __assign(__assign({}, params), { amount: ethers_1.ethers.formatUnits(amountWei + gasCost, 18), expectedProfit: ethers_1.ethers.formatUnits(expectedProfitWei + gasCost, 18) }) : params;
                        return [4 /*yield*/, this.validateFlashLoan(modifiedParams)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.simulateExecution(modifiedParams)];
                    case 3:
                        simulation = _a.sent();
                        if (!simulation.success) {
                            throw new Error("Simulation failed: ".concat(simulation.error));
                        }
                        return [4 /*yield*/, this.sendFlashLoanTransaction(params)];
                    case 4:
                        txHash = _a.sent();
                        // Monitor transaction
                        return [4 /*yield*/, this.monitorTransaction(txHash)];
                    case 5:
                        // Monitor transaction
                        _a.sent();
                        return [2 /*return*/, txHash];
                    case 6:
                        error_1 = _a.sent();
                        throw new Error("Flash loan execution failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FlashLoanHandler.prototype.estimateGasCost = function (_params) {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, estimatedGas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentGasPrice()];
                    case 1:
                        gasPrice = _a.sent();
                        estimatedGas = 500000n;
                        return [2 /*return*/, gasPrice * estimatedGas];
                }
            });
        });
    };
    FlashLoanHandler.prototype.getCurrentGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var provider, maxFeePerGas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        provider = new ethers_1.ethers.JsonRpcProvider(process.env.PROVIDER_URL);
                        return [4 /*yield*/, provider.getFeeData()];
                    case 1:
                        maxFeePerGas = (_a.sent()).maxFeePerGas;
                        return [2 /*return*/, maxFeePerGas !== null && maxFeePerGas !== void 0 ? maxFeePerGas : 50000000000n]; // 50 gwei default
                }
            });
        });
    };
    FlashLoanHandler.prototype.simulateExecution = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var gasCost, expectedProfitWei, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.estimateGasCost(params)];
                    case 1:
                        gasCost = _a.sent();
                        expectedProfitWei = ethers_1.ethers.parseUnits(params.expectedProfit, 18);
                        if (expectedProfitWei <= gasCost) {
                            return [2 /*return*/, { success: false, error: 'Expected profit does not cover gas costs' }];
                        }
                        return [2 /*return*/, { success: true, error: null }];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, { success: false, error: error_2.message }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FlashLoanHandler.prototype.sendFlashLoanTransaction = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, wallet, flashLoanContract, assets, amounts, premium, initiator, loanParams, tx, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        provider = new ethers_1.ethers.JsonRpcProvider(process.env.PROVIDER_URL);
                        wallet = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, provider);
                        flashLoanContract = new ethers_1.ethers.Contract(this.FLASH_LOAN_CONTRACT_ADDRESS, [
                            'function executeOperation(address[] calldata assets, uint256[] calldata amounts, uint256 premium, address initiator, bytes calldata params) external returns (bool)'
                        ], wallet);
                        assets = [params.token];
                        amounts = [ethers_1.ethers.parseUnits(params.amount, 18)];
                        premium = ethers_1.ethers.parseUnits('0', 18);
                        initiator = wallet.address;
                        loanParams = ethers_1.ethers.toUtf8Bytes('');
                        return [4 /*yield*/, flashLoanContract.executeOperation(assets, amounts, premium, initiator, loanParams, {
                                gasLimit: 1000000, // Adjust gas limit as needed
                            })];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, tx.wait()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, tx.hash];
                    case 3:
                        error_3 = _a.sent();
                        throw new Error("Transaction failed: ".concat(error_3.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FlashLoanHandler.prototype.monitorTransaction = function (txHash) {
        return __awaiter(this, void 0, void 0, function () {
            var provider, receipt, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        provider = new ethers_1.ethers.JsonRpcProvider(process.env.PROVIDER_URL);
                        return [4 /*yield*/, provider.getTransactionReceipt(txHash)];
                    case 1:
                        receipt = _a.sent();
                        if (receipt && receipt.status === 1) {
                            console.log("Transaction ".concat(txHash, " successful"));
                        }
                        else {
                            throw new Error("Transaction ".concat(txHash, " failed"));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error monitoring transaction ".concat(txHash, ":"), error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return FlashLoanHandler;
}());
exports.FlashLoanHandler = FlashLoanHandler;
export {};
