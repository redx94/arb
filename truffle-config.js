const { HDWalletProvider } = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  networks: {
    mainnet: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        process.env.PROVIDER_URL
      ),
      network_id: 1,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
