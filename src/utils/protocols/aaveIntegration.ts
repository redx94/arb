import { ethers } from 'ethers';
import { Logger } from '../monitoring.js';

const logger = Logger.getInstance();

export class AaveIntegration {
  private static instance: AaveIntegration;

  public static getInstance(): AaveIntegration {
    if (!AaveIntegration.instance) {
      AaveIntegration.instance = new AaveIntegration();
    }
    return AaveIntegration.instance;
  }

  public async getLendingRates() {
    // Get supply and borrow APY
    return {
      supplyAPY: 0,
      borrowAPY: 0,
      utilizationRate: 0,
    };
  }

  public async getCollateralFactor(): Promise<number> {
    // Get max borrowing power for collateral
    return 0.8; // 80% example
  }

  public async executeFlashLoan(
    token: string,
    amount: string,
    receiver: string,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const providerUrl = process.env.PROVIDER_URL;
      const privateKey = process.env.PRIVATE_KEY;
      const aavePoolAddress = process.env.AAVE_POOL_ADDRESS;

      logger.info(`Executing Aave flash loan: token=${token}, amount=${amount}, receiver=${receiver}`);

      if (!providerUrl || !privateKey || !aavePoolAddress) {
        logger.error(`Missing configuration: providerUrl=${providerUrl}, privateKey=${privateKey}, aavePoolAddress=${aavePoolAddress}`);
        throw new Error(
          'Missing provider URL, private key, or Aave Pool address'
        );
      }

      const provider = new ethers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      const aavePool = new ethers.Contract(
        aavePoolAddress,
        [
          'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256 referralCode, address initiator) external',
        ],
        wallet
      );

      const assets = [token];
      const amounts = [ethers.parseEther(amount)];
      const referralCode = 0;
      const initiator = wallet.address;

      const tx = await aavePool.flashLoan(
        receiver,
        assets,
        amounts,
        referralCode,
        initiator
      );

      await tx.wait();

      logger.info(`Aave flash loan executed successfully: txHash=${tx.hash}`);
      console.log(`Aave flash loan executed successfully: txHash=${tx.hash}`);
      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      logger.error('Aave flash loan execution failed:', error, {
        token,
        amount,
        receiver
      });
      console.error('Aave flash loan execution failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}
