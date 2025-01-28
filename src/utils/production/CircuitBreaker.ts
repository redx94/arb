// Add to CircuitBreakerConfig interface
interface CircuitBreakerConfig {
  // ... existing config
  minDataPoints: number;         // Minimum data points required for analysis
  recoveryThreshold: number;     // Successful checks needed before re-enabling
  maxSlippage: number;          // Maximum allowed slippage
  emergencyContacts: string[];   // Notification endpoints
}

// Update config initialization
private readonly config: CircuitBreakerConfig = {
  // ... existing config
  minDataPoints: 10,            // Require at least 10 data points
  recoveryThreshold: 5,         // 5 successful checks before re-enabling
  maxSlippage: 0.03,           // 3% max slippage
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
      reason: \`Slippage \${(slippage * 100).toFixed(2)}% exceeds maximum\`
    };
  }
  
  return { passed: true };
}