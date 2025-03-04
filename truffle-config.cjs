const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545, // Ganache port
      network_id: "*" // Match any network id
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, process.env.PROVIDER_URL),
      network_id: 1
    }
  },
  compilers: {
    solc: {
      version: "0.8.20"
    }
  }
};
