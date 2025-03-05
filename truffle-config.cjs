const path = require('path');

module.exports = {
  contracts_directory: './contracts',
  contracts_build_directory: '/Users/redx/Documents/arb/build',

  // Configure paths for external libraries
  // resolver: { // Removed resolver alias as it caused errors
  //   alias: {
  //     '@chainlink/contracts': path.resolve(__dirname, 'node_modules/@chainlink/contracts')
  //   }
  // },

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975, // Adjust gas limit as needed
      gasPrice: 20000000000 // Adjust gas price as needed
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
          "@chainlink/contracts/=node_modules/@chainlink/contracts/"
        ]
      }
    }
  }
};
