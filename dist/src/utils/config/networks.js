export const networks = {
    mainnet: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2',
        wsUrl: 'wss://eth-mainnet.alchemyapi.io/v2',
        explorer: 'https://etherscan.io'
    },
    polygon: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: 'https://polygon-mainnet.alchemyapi.io/v2',
        wsUrl: 'wss://polygon-mainnet.alchemyapi.io/v2',
        explorer: 'https://polygonscan.com'
    },
    arbitrum: {
        name: 'Arbitrum One',
        chainId: 42161,
        rpcUrl: 'https://arb-mainnet.alchemyapi.io/v2',
        wsUrl: 'wss://arb-mainnet.alchemyapi.io/v2',
        explorer: 'https://arbiscan.io'
    },
    optimism: {
        name: 'Optimism',
        chainId: 10,
        rpcUrl: 'https://opt-mainnet.alchemyapi.io/v2',
        wsUrl: 'wss://opt-mainnet.alchemyapi.io/v2',
        explorer: 'https://optimistic.etherscan.io'
    },
    local: {
        name: 'Local Network',
        chainId: 1337,
        rpcUrl: 'http://localhost:8545',
        explorer: 'http://localhost:8545'
    }
};
