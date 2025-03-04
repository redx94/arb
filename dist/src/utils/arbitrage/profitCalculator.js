import * as ethers from "ethers";
import { Logger } from "../monitoring/index.js";
const logger = Logger.getInstance();
const getRandomChange = () => (Math.random() - 0.5) * 0.1; // -5% to +5%
export class ProfitCalculator {
    constructor() {
        Object.defineProperty(this, "GAS_PRICE_BUFFER", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.2
        }); // 20% buffer for gas price fluctuations
        Object.defineProperty(this, "FLASH_LOAN_FEE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.0009
        }); // 0.09% flash loan fee
        Object.defineProperty(this, "MIN_PROFIT_THRESHOLD", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Number('0.01')
        }); // 0.01 ETH
    }
    static getInstance() {
        if (!ProfitCalculator.instance) {
            ProfitCalculator.instance = new ProfitCalculator();
        }
        return ProfitCalculator.instance;
    }
    async calculatePotentialProfit(buyPrice, sellPrice, amount, _priceData) {
        try {
            const amountBN = Number(amount.toString());
            const buyPriceBN = Number(buyPrice.toString());
            const sellPriceBN = Number(sellPrice.toString());
            const grossProfit = (amountBN * (sellPriceBN - buyPriceBN));
            const { flashLoanCost, gasCost, slippageCost } = await this.calculateCosts(amountBN, buyPriceBN, _priceData);
            const totalCosts = gasCost + flashLoanCost + slippageCost;
            const netProfit = grossProfit - totalCosts;
            const netProfitBN = ethers.toBigInt(netProfit);
            const minProfitThresholdBN = ethers.toBigInt(this.MIN_PROFIT_THRESHOLD);
            console.log('grossProfit:', grossProfit.toString());
            console.log('totalCosts:', totalCosts.toString());
            console.log('netProfit:', netProfitBN.toString());
            return {
                profit: Number(netProfitBN),
                isViable: netProfitBN > minProfitThresholdBN,
                details: {
                    grossProfit,
                    totalCosts,
                    breakdown: {
                        flashLoanCost,
                        gasCost,
                        slippageCost
                    }
                }
            };
        }
        catch (error) {
            logger.error('Error calculating profit:', error);
            throw error;
        }
    }
    async calculateCosts(amount, price, _priceData) {
        const flashLoanCost = (amount * price * Number(this.FLASH_LOAN_FEE));
        const estimatedGasUnits = 250000n;
        const gasPrice = await this.getGasPrice();
        const gasCost = Number(gasPrice) * Number(estimatedGasUnits);
        const slippageCost = this.calculateSlippageCost(amount, price, _priceData);
        return {
            flashLoanCost,
            gasCost,
            slippageCost
        };
    }
    async getGasPrice() {
        const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || Number('10');
        return gasPrice;
    }
    calculateSlippageCost(amount, price, _priceData) {
        // Calculate slippage based on order size and liquidity
        const baseSlippage = 0.001; // 0.1% base slippage
        const volumeSlippage = ((Number(amount)) * (Number(price))) / (1000); // Additional slippage based on volume
        return ((Number(amount)) * (Number(price))) * (0.001 + (volumeSlippage)) / (1);
    }
}
