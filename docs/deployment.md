# Deployment Guide

## Deployment Environments

### Staging Environment
- URL: `https://staging.arbitrage-system.com`
- Branch: `main`
- Auto-deployment: Yes
- Required approvals: 1

### Production Environment
- URL: `https://arbitrage-system.com`
- Branch: `production`
- Auto-deployment: No
- Required approvals: 2

## Deployment Process

### 1. Build Process
```bash
# Install dependencies
npm ci

# Run tests
npm run test

# Build application
npm run build
```

### 2. Environment Configuration
```env
# Production environment variables
VITE_API_URL=https://api.arbitrage-system.com
VITE_WEBSOCKET_URL=wss://ws.arbitrage-system.com
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
```

### 3. Deployment Steps
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## Monitoring

### Health Checks
- API endpoint: `/health`
- WebSocket connection
- Database connectivity
- External service status

### Alerts
- System health
- Performance metrics
- Error rates
- Trading activity

## Rollback Procedure

### Quick Rollback
```bash
# Revert to previous version
git checkout v1.2.3
npm run deploy:production
```

### Emergency Shutdown
```bash
# Stop trading activities
curl -X POST https://api.arbitrage-system.com/v1/emergency/stop
```

## Smart Contract Deployment

### Prerequisites
- Truffle or Hardhat installed
- Ganache or other local Ethereum network running
- Account with sufficient ETH for deployment

### Deployment Steps
1. Compile the contracts:
    ```bash
    truffle compile
    ```
2. Deploy the contracts to the network:
    ```bash
    truffle migrate --network <network-name>
    ```
3. Verify the contract on Etherscan (optional):
    ```bash
    truffle run verify ArbTrader --network <network-name>
    ```

### Configuration
After deploying the contracts, update the contract addresses in the frontend application's configuration file (`src/utils/config/configManager.ts` or similar).
```typescript
const config = {
  arbTraderAddress: "0x...",
  // other configurations
};
```
