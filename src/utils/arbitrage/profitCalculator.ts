import * as ethers from "ethers";
import { Logger } from "../monitoring/index.js";
import { PriceFeed } from "../priceFeeds";

const logger = Logger.getInstance();
const getRandomChange = () => (Math.random() - 0.5) * 0.1; // -5% to +5%

export class ProfitCalculator {
    GAS_PRICE_BUFFER = 1.2; // 20% buffer for gas price fluctuations
    FLASH_LOAN_FEE = 0.0009; // 0.09% flash loan fee
    MIN_PROFIT_THRESHOLD = Number('0.01'); // 0.01 ETH

    private static instance: ProfitCalculator;
    private constructor() { }

    public static getInstance(): ProfitCalculator {
        if (!ProfitCalculator.instance) {
            ProfitCalculator.instance = new ProfitCalculator();
        }
        return ProfitCalculator.instance;
    }

    async calculatePotentialProfit(buyPrice: number, sellPrice: number, amount: number, _priceData?: any): Promise<{ profit: number, isViable: boolean, details: any }> {
        try {
            const amountBN: number = Number(amount.toString());
            const buyPriceBN: number = Number(buyPrice.toString());
            const sellPriceBN: number = Number(sellPrice.toString());

            const grossProfit: number = (amountBN * (sellPriceBN - buyPriceBN));

            const { flashLoanCost, gasCost, slippageCost } = await this.calculateCosts(amountBN, buyPriceBN, _priceData);
            const totalCosts: number = gasCost + flashLoanCost + slippageCost;
            const netProfit: number = grossProfit - totalCosts;

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
        } catch (error: any) {
            logger.error('Error calculating profit:', error);
            throw error;
        }
    }

async calculateCosts(amount: number, price: number, _priceData?: any): Promise<{ flashLoanCost: number, gasCost: number, slippageCost: number }> {
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

    async getGasPrice(): Promise<any> {
        const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
        const feeData = await provider.getFeeData();
        const gasPrice: any = feeData.maxFeePerGas || feeData.gasPrice || Number('10');
        return gasPrice;
    }

calculateSlippageCost(amount: number, price: number, _priceData?: any): any {
        // Calculate slippage based on order size and liquidity
        const baseSlippage = 0.001; // 0.1% base slippage
const volumeSlippage = ((Number(amount))*(Number(price)))/(1000); // Additional slippage based on volume
        return ((Number(amount))*(Number(price)))*(0.001 + (volumeSlippage))/(1);
    }
}
