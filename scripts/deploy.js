// scripts/deploy.js

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");

// Load compiled contract artifact
const artifactPath = path.resolve(__dirname, "../build/contracts/ArbTrader.json");
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function deploy() {
  // Set up provider using environment variables
  const provider = new HDWalletProvider(
    process.env.MNEMONIC,
    process.env.PROVIDER_URL
  );
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  console.log("Deploying from account:", accounts[0]);

  const deployOptions = {
    data: bytecode,
    arguments: []
  };

  const gasPrice = await web3.eth.getGasPrice();
  console.log("Current Gas Price:", gasPrice);

  // Deploy contract
  const contractInstance = await new web3.eth.Contract(abi)
    .deploy(deployOptions)
    .send({
      from: accounts[0],
      gas: 6000000,
      gasPrice: gasPrice
    });

  console.log("Contract deployed at address:", contractInstance.options.address);
  provider.engine.stop();
}

deploy().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
