import { ethers } from 'ethers';
const { ProfitCalculator } = await import('./dist/src/utils/arbitrage/profitCalculator.js');
const { PriceFeed } = await import('./dist/src/utils/priceFeeds.js');

async function main() {
  const profitCalculator = ProfitCalculator.getInstance();
  const priceFeed = PriceFeed.getInstance();
  const currentPriceData = await priceFeed.getCurrentPrice();

  if (!currentPriceData) {
    console.error('Could not fetch current price data.');
    return;
  }

  const buyPrice = currentPriceData.price;
  const sellPrice = currentPriceData.price * 1.02; // 2% higher sell price
  const amount = 1;
  const result = await profitCalculator.calculatePotentialProfit(buyPrice, sellPrice, amount, currentPriceData);
  const netProfitWei = result.profit;
  const netProfitETH = ethers.formatEther(netProfitWei);
  const ethPriceInUSD = currentPriceData.price;
  const netProfitUSD = Number(netProfitETH) * ethPriceInUSD;
  console.log('Current ETH Price (USD):', ethPriceInUSD);
  console.log('Net Profit (ETH):', netProfitETH);
  console.log('Net Profit (USD):', netProfitUSD);
}

const { FlashLoanHandler } = await import('./dist/src/utils/flashLoanHandler.js');

async function testFlashLoan() {
  const flashLoanHandler = FlashLoanHandler.getInstance();
  const params = {
    amount: '1', // Amount of token to borrow
    token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEeEeeEeee', // ETH address
    protocol: 'AAVE',
    expectedProfit: '0.02',
    maxSlippage: 0.01,
    deadline: Date.now() + 60000, // 1 minute from now
  };

  try {
    const txHash = await flashLoanHandler.executeFlashLoan(params);
    console.log('Flash Loan Transaction Hash:', txHash);
  } catch (error) {
    console.error('Flash Loan Failed:', error);
  }
}

async function run() {
  await main();
  await testFlashLoan();
}

run();
