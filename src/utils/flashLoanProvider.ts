import * as ethers from 'ethers';
import { Logger } from './monitoring.js';
import type { FlashLoanParams } from '../types/index.js';

const logger = Logger.getInstance();

export class FlashLoanProvider {
  public async executeFlashLoan(params: FlashLoanParams): Promise<string | void> {
    try {
      const providerUrl = process.env.PROVIDER_URL;
      const privateKey = process.env.PRIVATE_KEY;
      const zeroCapitalArbTraderAddress = process.env.ZERO_CAPITAL_ARB_TRADER_ADDRESS;

      logger.info('Executing flash loan via ZeroCapitalArbTrader: token=' + params.token + ', amount=' + params.amount);

      if (!providerUrl || !zeroCapitalArbTraderAddress || !privateKey) {
        logger.error('Missing configuration: providerUrl=' + providerUrl + ', zeroCapitalArbTraderAddress=' + zeroCapitalArbTraderAddress + ', privateKey=' + privateKey);
        throw new Error('Missing provider URL, ZeroCapitalArbTrader address, or private key');
      }

      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const zeroCapitalArbTrader = new ethers.Contract(
        zeroCapitalArbTraderAddress,
        ['function requestFlashLoan(address asset, uint256 amount) external'],
        wallet
      );

      const tx = await zeroCapitalArbTrader.requestFlashLoan(
        params.token,
        ethers.utils.parseEther(params.amount)
      );

      await tx.wait();

      logger.info('ZeroCapitalArbTrader flash loan initiated successfully: txHash=' + tx.hash);
      return tx.hash;
    } catch (error: any) {
      logger.error('ZeroCapitalArbTrader flash loan execution failed: ' + error);
      throw error;
    }
    return ''; // Explicit return to satisfy TypeScript
  }
}
