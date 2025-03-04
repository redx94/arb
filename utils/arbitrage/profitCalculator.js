import { ethers } from "ethers";
import { Logger } from "../monitoring.mjs";
const logger = Logger.getInstance ? Logger.getInstance() : new Logger();
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
            value: ethers.parseEther('0.01')
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
            const amountBN = ethers.parseEther(amount.toString());
            const buyPriceBN = ethers.parseEther(buyPrice.toString());
            const sellPriceBN = ethers.parseEther(sellPrice.toString());
            const grossProfit = (amountBN.mul(sellPriceBN.sub(buyPriceBN))).div(ethers.parseEther('1'));
            const { flashLoanCost, gasCost, slippageCost } = await this.calculateCosts(amountBN, buyPriceBN, _priceData);
            const totalCosts = gasCost;
            const netProfit = grossProfit.sub(totalCosts);
            console.log('grossProfit:', grossProfit.toString());
            console.log('totalCosts:', totalCosts.toString());
            console.log('netProfit:', netProfit.toString());
            return {
                profit: netProfit,
                isViable: netProfit.gt(this.MIN_PROFIT_THRESHOLD),
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
        const flashLoanCost = (amount.mul(price).mul(ethers.parseEther(this.FLASH_LOAN_FEE.toString()))).div(ethers.parseEther('1'));
        const estimatedGasUnits = 250000n;
        const gasPrice = await this.getGasPrice();
        const gasCost = gasPrice.mul(estimatedGasUnits);
        const slippageCost = this.calculateSlippageCost(amount, price, _priceData);
        return {
            flashLoanCost,
            gasCost,
            slippageCost
        };
    }
    async getGasPrice() {
        // Return a fixed gas price for testing
        return ethers.parseUnits('1', 'gwei');
    }
    calculateSlippageCost(amount, price, _priceData) {
        // Calculate slippage based on order size and liquidity
        const baseSlippage = 0.001; // 0.1% base slippage
        const volumeSlippage = (amount.mul(price)).div(ethers.parseEther('1000')); // Additional slippage based on volume
        return (amount.mul(price).mul(ethers.parseEther((baseSlippage + Number(volumeSlippage)).toString()))).div(ethers.parseEther('1'));
    }
}
