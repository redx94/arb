# System Components

## Price Feed Service

The price feed service maintains real-time connections to multiple exchanges and provides normalized price data to the system.

### Features
- Multi-exchange support
- WebSocket connections
- Price normalization
- Connection health monitoring

### Configuration
```typescript
interface PriceFeedConfig {
  updateInterval: number;     // Price update interval in ms
  maxRetries: number;        // Maximum connection retry attempts
  timeout: number;           // Connection timeout in ms
  validatePrices: boolean;   // Enable price validation
}
```

### Usage Example
```typescript
import { PriceFeed } from '../utils/priceFeeds';

const priceFeed = PriceFeed.getInstance();

priceFeed.subscribe((priceData) => {
  console.log('New price data:', priceData);
});
```

## Arbitrage Engine

The core component responsible for identifying and executing arbitrage opportunities.

### Features
- Real-time opportunity detection
- Profit calculation
- Trade path optimization
- Circuit breaker implementation

### Configuration
```typescript
interface ArbitrageConfig {
  minProfitThreshold: number;  // Minimum profit percentage
  maxExecutionTime: number;    // Maximum execution time in ms
  maxSlippage: number;        // Maximum allowed slippage
  gasMultiplier: number;      // Gas price multiplier
}
```

### Usage Example
```typescript
import { ArbitrageEngine } from '../utils/arbitrage/arbitrageEngine';

const engine = ArbitrageEngine.getInstance();

engine.on('opportunity', (data) => {
  console.log('Arbitrage opportunity found:', data);
});
```