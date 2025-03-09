require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
const { ethers } = require("ethers");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/4b9e1ec153a14901b9adc5174c838658",
      accounts: [process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001"]
    }
  }
};
