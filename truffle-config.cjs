const path = require('path');
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY;
const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;

module.exports = {
  contracts_directory: './contracts',
  contracts_build_directory: '/Users/redx/Documents/arb/build',
  contracts_ignore: ["ZeroCapitalArbTrader.sol"],

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },
    sepolia: {
      provider: () => new HDWalletProvider(privateKey, process.env.PROVIDER_URL),
      network_id: 11155111,
      gas: 4000000,
      gasPrice: 10000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        remappings: [
          "@chainlink/contracts/=node_modules/@chainlink/contracts/",
          "@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"
        ]
      },
      viaIR: true
    }
  },
  // Pass contract addresses to migrations
  migrations_compile_mocha: {
    feeRecipient: feeRecipient
  }
};
