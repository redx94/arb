import * as dotenv from 'dotenv';
dotenv.config();
import { ethers } from 'ethers';
import { GasAwareFlashLoanProvider } from './dist/utils/gas/GasAwareFlashLoan.js'; // Import GasAwareFlashLoanProvider

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Account address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  const gasAwareFlashLoanProvider = new GasAwareFlashLoanProvider(); // Use GasAwareFlashLoanProvider
  const params = {
    amount: '1', // Amount of token to borrow
    token: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI address (Mainnet)
    protocol: 'AAVE', // Placeholder
    expectedProfit: '0.02', // Placeholder
    maxSlippage: 0.01, // Placeholder
    deadline: Date.now() + 60000, // 1 minute from now
  };

  try {
    const txHash = await gasAwareFlashLoanProvider.executeFlashLoan(params); // Use GasAwareFlashLoanProvider instance
    console.log('Flash Loan Transaction Hash:', txHash);
  } catch (error) {
    console.error('Flash Loan Failed:', error);
  }
}

main();
