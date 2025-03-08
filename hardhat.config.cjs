require("@nomiclabs/hardhat-waffle");

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
      accounts: ["5308b9572838bb9980507e15cb15034dfcdbcd7285e375d7e1c862d9e80ddf5e"]
    }
  }
};
