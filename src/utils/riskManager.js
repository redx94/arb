"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskManager = void 0;
var RiskManager = /** @class */ (function () {
    function RiskManager() {
        this.MAX_TRADE_SIZE = process.env.MAX_TRADE_SIZE || '100'; // Maximum trade size in ETH
    }
    RiskManager.getInstance = function () {
        if (!RiskManager.instance) {
            RiskManager.instance = new RiskManager();
        }
        return RiskManager.instance;
    };
    // Updated validation: if price difference exceeds 5%, throw an error.
    RiskManager.prototype.validateTrade = function (data) {
        var diffPercentage = (Math.abs(data.cex - data.dex) / Math.min(data.cex, data.dex)) * 100;
        if (diffPercentage > 5) {
            throw new Error('Risk limit exceeded: Price difference exceeds 5% threshold.');
        }
        if (data.amount > Number(this.MAX_TRADE_SIZE)) {
            throw new Error("Risk limit exceeded: Trade amount exceeds maximum trade size of ".concat(this.MAX_TRADE_SIZE, " ETH."));
        }
    };
    return RiskManager;
}());
exports.RiskManager = RiskManager;
