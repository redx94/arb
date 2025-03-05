import * as ethers from "ethers";
import { Logger } from "../monitoring/index.js";
import { PriceFeed } from "../priceFeeds.js";

const logger = Logger.getInstance();
const getRandomChange = () => (Math.random() - 0.5) * 0.1; // -5% to +5%

export class ProfitCalculator {
    GAS_PRICE_BUFFER = 1.2; // 20% buffer for gas price fluctuations
    FLASH_LOAN_FEE = 0.0009; // 0.09% flash loan fee
    MIN_PROFIT_THRESHOLD = 0.01; // 0.01 ETH

    private static instance: ProfitCalculator;
    private constructor() { }

    public static getInstance(): ProfitCalculator {
        if (!ProfitCalculator.instance) {
            ProfitCalculator.instance = new ProfitCalculator();
        }
        return ProfitCalculator.instance;
    }

    async calculatePotentialProfit(buyPrice: bigint, sellPrice: bigint, amount: bigint, _priceData?: any): Promise<{ profit: number, isViable: boolean, details: any }> {
        try {
            const grossProfit: bigint = (amount * (sellPrice - buyPrice));

            const { flashLoanCost, gasCost, slippageCost } = await this.calculateCosts(amount, buyPrice, _priceData);
            const totalCosts: bigint = flashLoanCost + gasCost + slippageCost;
            const netProfit: bigint = grossProfit - totalCosts;

            console.log('grossProfit:', grossProfit.toString());
            console.log('totalCosts:', totalCosts.toString());
            console.log('netProfit:', netProfit.toString());

            return {
                profit: Number(netProfit),
                isViable: Number(netProfit) > this.MIN_PROFIT_THRESHOLD,
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

async calculateCosts(amount: bigint, price: bigint, _priceData?: any): Promise<{ flashLoanCost: bigint, gasCost: bigint, slippageCost: bigint }> {
        const flashLoanCost = BigInt(Math.round(Number(amount * price) * this.FLASH_LOAN_FEE));
        const estimatedGasUnits = 250000n;
        const gasPrice = await this.getGasPrice();
        const gasCost = BigInt(Math.round(Number(gasPrice) * Number(estimatedGasUnits)));
        const slippageCost = BigInt(Math.round(await this.calculateSlippageCost(Number(amount), Number(price), _priceData)));

        return {
            flashLoanCost,
            gasCost,
            slippageCost
        };
    }

    async getGasPrice(): Promise<any> {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice ? Number(feeData.gasPrice) : 10;
            if (isNaN(gasPrice)) {
                logger.error('Invalid gas price received, using default gas price.');
                return 10; // Default gas price
            }
            return gasPrice;
        } catch (error: any) {
            logger.error('Failed to fetch gas price:', error instanceof Error ? error : new Error(String(error)));
            return 10; // Default gas price
        }
    }

async calculateSlippageCost(amount: number, price: number, _priceData?: any): Promise<number> {
        // Calculate slippage based on order size and liquidity
        const baseSlippage = 0.001; // 0.1% base slippage
        const priceFeed = PriceFeed.getInstance();
        const dexLiquidity = await priceFeed.getDexLiquidity();
        const volumeSlippage = ((Number(amount))*(Number(price)))/(dexLiquidity); // Additional slippage based on volume
        return ((Number(amount))*(Number(price)))*(0.001 + (volumeSlippage))/(1);
    } catch (error: any) {
        logger.error('Failed to calculate slippage cost:', error instanceof Error ? error : new Error(String(error)));
        return 0; // Default slippage cost
    }
}
