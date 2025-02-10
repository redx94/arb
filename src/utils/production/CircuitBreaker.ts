interface CircuitBreakerConfig {
  minDataPoints: number;
  recoveryThreshold: number;
  maxSlippage: number;
  emergencyContacts: string[];
  }

export class CircuitBreaker {
  private readonly config: CircuitBreakerConfig = {
    minDataPoints: 10,
    recoveryThreshold: 5,
    maxSlippage: 0.03,
    emergencyContacts: [
      'admin@example.com',
      'security@example.com'
    ]
  };
  // Add slippage check
  private async checkSlippage(params: {
    expectedPrice: number;
    executionPrice: number;
  }): Promise<{ passed: boolean; reason?: string }> {
    const { expectedPrice, executionPrice } = params;
    const slippage = Math.abs(expectedPrice - executionPrice) / expectedPrice;
    
    if (slippage > this.config.maxSlippage) {
      return {
        passed: false,
        reason: `Slippage ${(slippage * 100).toFixed(2)}% exceeds maximum`
      };
    }
    
    return { passed: true };
}
}
