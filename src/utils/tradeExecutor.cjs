"use strict";

const priceFeeds_js_1 = require("./priceFeeds.cjs");
const GasAwareFlashLoan_js_1 = require("./gas/GasAwareFlashLoan.js");
const riskManager_js_1 = require("./riskManager.cjs");
const monitoring_js_1 = require("./monitoring.cjs");
const wallet_js_1 = require("./wallet.js");
const ethers_1 = require("ethers");
const GasOptimizer_js_1 = require("./gas/GasOptimizer.js");

class TradeExecutor {
    constructor() {
        this.logger = monitoring_js_1.Logger.getInstance();
        this.balances = [
            { asset: 'ETH', dexAmount: 10n, cexAmount: 10n, pending: 0n }, 
        ];
        this.walletManagerInstance = wallet_js_1.walletManager; 
    }
    getBalances() {
        return this.balances;
    }
    async executeTrade(type, platform, amount, price, token, protocol) {
        try {
            this.logger.info(`Executing trade: type=${type}, platform=${platform}, amount=${amount}, price=${price}, token=${token}, protocol=${protocol}`);
            const amountNumber = BigInt(amount);
            if (isNaN(Number(amountNumber)) || amountNumber <= 0n) {
                this.logger.error(`Invalid trade amount: amount=${amount}`);
                throw new Error('Invalid trade amount');
            }
            const riskManager = riskManager_js_1.RiskManager.getInstance();
            const priceFeed = priceFeeds_js_1.PriceFeed.getInstance();
            const priceData = await priceFeed.getCurrentPrice(platform);
            if (!priceData) {
                throw new Error('Failed to fetch current price');
            }
            riskManager.validateTrade({ dex: Number(priceData.dex), cex: Number(priceData.cex), amount: Number(amountNumber) });
            const gasAwareFlashLoanProvider = new GasAwareFlashLoan_js_1.GasAwareFlashLoanProvider();
            const flashLoanParams = {
                amount: amount,
                token: token,
                protocol: protocol,
                expectedProfit: (amountNumber * price / 100n).toString(), 
                maxSlippage: 0.01,
                deadline: Date.now() + 60000,
            };
            let flashLoanUsed = false;
            const maxRetries = 3;
            let retryCount = 0;
            flashLoanParams.amount = (BigInt(flashLoanParams.amount) + GasOptimizer_js_1.GasOptimizer.estimateGasCost()).toString();
            while (retryCount < maxRetries) {
                try {
                    await gasAwareFlashLoanProvider.executeFlashLoan(flashLoanParams);
                    flashLoanUsed = true;
                    break; 
                }
                catch (flashLoanError) {
                    this.logger.warn(`Flash loan failed (attempt ${retryCount + 1}): ${flashLoanError.message}`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
            }
            if (!flashLoanUsed) {
                this.logger.error('Flash loan failed after multiple retries. Trade execution aborted.');
                return { success: false, error: 'Flash loan failed after multiple retries. Trade execution aborted.' };
            }
            const tradeDetails = {
                id: Math.random().toString(36).substring(2, 15),
                type: type,
                platform: platform,
                amount: BigInt(amountNumber),
                price: BigInt(price),
                effectivePrice: BigInt(price),
                profitLoss: 0n,
                priceImpact: 0n,
                gasCost: 0n,
                timestamp: Date.now(),
                status: 'COMPLETED',
                warnings: [],
                executedPrice: 0n,
                slippage: 0n,
                feeStructure: {
                    makerFee: 0n,
                    takerFee: 0n,
                },
            };
            this.logger.info(`Trade details: ${JSON.stringify(tradeDetails)}`);
            this.logger.info(`Trade executed successfully: id=${tradeDetails.id}, flashLoanUsed=${flashLoanUsed}, tradeDetails=${JSON.stringify(tradeDetails)}`);
            await this.depositProfit(tradeDetails);
            return { success: true, trade: tradeDetails };
        }
        catch (error) {
            this.logger.error('Trade execution failed:', error, {
                type,
                platform,
                amount,
                price,
            });
            console.error(`Trade execution failed: ${error.message}, type=${type}, platform=${platform}, amount=${amount}, price=${price}`);
            return { success: false, error: error.message };
        }
    }
    async calculateProfit(trade) {
        const profitBigint = (trade.type === 'SELL' ? 1n : -1n) *
            trade.amount *
            (trade.effectivePrice - trade.price);
        const gasOptimizer = GasOptimizer_js_1.GasOptimizer.getInstance();
        try {
            const gasStrategy = await gasOptimizer.calculateOptimalGasStrategy(profitBigint);
            const gasCost = BigInt(gasStrategy.baseGas) + BigInt(gasStrategy.priorityFee) * BigInt(gasStrategy.gasLimit);
            const profitAfterGas = profitBigint - gasCost;
            return profitAfterGas;
        }
        catch (error) {
            this.logger.error('Error calculating gas costs:', error);
            console.error('Error calculating gas costs:', error);
            return 0n; 
        }
    }
    async depositProfit(tradeDetails) {
        try {
            const profit = await this.calculateProfit(tradeDetails);
            const walletAddress = process.env.WALLET_ADDRESS;
            if (!walletAddress) {
                this.logger.error('WALLET_ADDRESS environment variable not set.');
                console.error('WALLET_ADDRESS environment variable not set.');
                return;
            }
            if (profit <= 0n) {
                this.logger.info('No profit to deposit.');
                console.log('No profit to deposit.');
                return;
            }
            const value = ethers_1.ethers.ethers.parseEther(ethers_1.ethers.ethers.formatEther(profit));
            const gasAllocationPercentage = parseFloat(process.env.GAS_ALLOCATION_PERCENTAGE || '0.05');
            const gasAllocation = BigInt(Math.floor(Number(profit) * gasAllocationPercentage));
            const profitAfterGasAllocation = profit - gasAllocation;
            try {
                const tx = await this.walletManagerInstance.signTransaction(walletAddress, 
                walletAddress, ethers_1.ethers.ethers.formatEther(profitAfterGasAllocation));
                const txHash = await this.walletManagerInstance.sendTransaction(tx);
                this.logger.info(`Profit deposited to wallet ${walletAddress}, TX hash: ${txHash}`);
                console.log(`Profit deposited to wallet ${walletAddress}, TX hash: ${txHash}`);
                this.logger.info(`Allocated ${ethers_1.ethers.ethers.formatEther(gasAllocation)} ETH for future gas fees.`);
                console.log(`Allocated ${ethers_1.ethers.ethers.formatEther(gasAllocation)} ETH for future gas fees.`);
            }
            catch (signError) {
                this.logger.error('Error signing/sending transaction:', signError);
                console.error('Error signing/sending transaction:', signError);
            }
        }
        catch (error) {
            this.logger.error('Error depositing profit:', error instanceof Error ? error : new Error(String(error)));
            console.error('Error depositing profit:', error);
        }
    }
}

exports.tradeExecutor = new TradeExecutor();
