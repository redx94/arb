# Configuration Guide

## Environment Variables

### Required Variables
```env
# API Configuration
VITE_API_URL=https://api.example.com
VITE_WEBSOCKET_URL=wss://ws.example.com

# Ethereum Configuration
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
VITE_CHAIN_ID=1

# Security Configuration
VITE_MAX_GAS_PRICE=500
VITE_MIN_PROFIT_THRESHOLD=0.002
```

### Optional Variables
```env
# Performance Tuning
VITE_UPDATE_INTERVAL=1000
VITE_BATCH_SIZE=100
VITE_CACHE_DURATION=60000

# Monitoring
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=info
```

## System Parameters

### Risk Management
```typescript
export const riskConfig = {
  maxDrawdown: 0.2,        // 20% maximum drawdown
  positionLimit: 5,        // 5 ETH maximum position size
  stopLoss: 0.02,         // 2% stop loss
  emergencyTimeout: 30000  // 30 second timeout
};
```

### Gas Optimization
```typescript
export const gasConfig = {
  maxGasPrice: '500',     // Maximum gas price in gwei
  priorityFee: '2',       // Priority fee in gwei
  gasLimit: 300000,       // Gas limit for transactions
  retryAttempts: 3        // Number of retry attempts
};
```

### Performance Monitoring
```typescript
export const monitoringConfig = {
  metricsInterval: 5000,  // Metrics collection interval
  alertThreshold: 0.1,    // Alert threshold for deviations
  maxLatency: 500,        // Maximum acceptable latency
  healthCheckInterval: 30000  // Health check interval
};
```