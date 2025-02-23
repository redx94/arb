// truffle-config.js

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        ),
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    mainnet: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.PROVIDER_URL),
      network_id: 1,
      gas: 6000000,
      gasPrice: 0, // Set to 0 to use EIP-1559; adjust in deployment if needed.
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false
    }
  },
  // Enable the Solidity optimizer for lower gas costs.
  compilers: {
    solc: {
      version: "0.8.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
