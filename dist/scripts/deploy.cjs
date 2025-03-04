"use strict";
// scripts/deploy.js
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const Web3 = require("web3");
const fs = require("fs");
const path = require("path");
const { Wallet } = require('@ethereumjs/wallet');
const { Common } = require('@ethereumjs/common');
const { Transaction } = require('@ethereumjs/tx');
// Load compiled contract artifact
const artifactPath = path.resolve(__dirname, "../build/contracts/ArbTrader.json");
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
async function deploy() {
    try {
        // Set up provider using environment variables
        const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'hex');
        const providerUrl = process.env.PROVIDER_URL;
        const web3 = new Web3(providerUrl);
        const wallet = Wallet.fromPrivateKey(privateKey);
        const account = wallet.address;
        console.log("Deploying from account:", account.toString('hex'));
        const deployOptions = {
            data: bytecode,
            arguments: []
        };
        const common = new Common({ chain: 'mainnet', hardfork: 'paris' });
        // Estimate gas limit
        const gasLimit = await new web3.eth.Contract(abi)
            .deploy(deployOptions)
            .estimateGas({ from: account.toString('hex') });
        // Get gas price
        const gasPrice = await web3.eth.getGasPrice();
        // Nonce
        const nonce = await web3.eth.getTransactionCount(account.toString('hex'), 'pending');
        // Create transaction
        const txData = {
            nonce: web3.utils.toHex(nonce),
            gasLimit: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            data: bytecode,
        };
        const tx = Transaction.fromTxData(txData, { common });
        const signedTx = tx.sign(privateKey);
        const serializedTx = signedTx.serialize();
        // Send transaction
        const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
        console.log("Contract deployed at address:", receipt.contractAddress);
    }
    catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}
deploy().catch(error => console.error("Top level deployment error:", error));
