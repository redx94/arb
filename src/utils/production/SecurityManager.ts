import { ethers } from 'ethers';
import { CircuitBreaker } from './CircuitBreaker';
import { GasOptimizer } from '../gas/GasOptimizer';
import { RateLimiter } from '../security/RateLimiter';

export class SecurityManager {
  private static circuitBreaker = new CircuitBreaker();
  private static rateLimiter = new RateLimiter(parseInt(process.env.RATE_LIMIT_REQUESTS || '5')); // 5 requests/minute

  static verifyLiveEnvironment() {
    if (!process.env.PRIVATE_KEY?.startsWith('0x') || 
        !process.env.PROVIDER_URL?.includes('mainnet')) {
      throw new Error('Invalid production environment configuration');
    }
    
    if (this.circuitBreaker.isTriggered()) {
      throw new Error('Trading halted by circuit breaker');
    }
  }

  static async analyzeTxRisk(tx: ethers.Transaction): Promise<string[]> {
    const warnings = [];
    
    // Gas validation
    const estimatedGas = await GasOptimizer.estimateGasCost(tx);
    if (Number(estimatedGas) > Number(ethers.parseUnits(process.env.MAX_GAS_COST_THRESHOLD || '0.1', 'ether'))) {
      warnings.push(`Gas cost exceeds ${process.env.MAX_GAS_COST_THRESHOLD || '0.1'} ETH threshold`);
      this.circuitBreaker.recordIncident();
    }

    // Slippage check
    if (tx.data.includes('0x') && Number(tx.value) > Number(ethers.parseEther(process.env.LARGE_VALUE_TRANSFER_THRESHOLD || '100'))) {
      warnings.push(`Large value transfer detected (over ${process.env.LARGE_VALUE_TRANSFER_THRESHOLD || '100'} ETH)`);
    }

    // Rate limiting
    if (!this.rateLimiter.checkLimit()) {
      throw new Error('Rate limit exceeded - too many transactions');
    }

    return warnings;
  }

  static async simulateTransaction(tx: ethers.Transaction): Promise<boolean> {
    try {
      const simulator = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
      await simulator.call(tx);
      return true;
    } catch (error) {
      this.circuitBreaker.recordIncident();
      return false;
    }
  }

  static logError(error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[SECURITY][${new Date().toISOString()}]`, err);
    this.circuitBreaker.recordIncident();
    
    if (this.circuitBreaker.isTriggered()) {
      console.error('[CIRCUIT BREAKER] Trading suspended until manual reset');
    }
  }
}
