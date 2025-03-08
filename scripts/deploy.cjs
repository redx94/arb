// scripts/deploy.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const ethers = require('ethers');

// Load compiled contract artifact
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Load compiled contract artifacts
const artifactPath = path.resolve(__dirname, "../build/contracts/ArbTrader.json");
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const zeroCapitalArbTraderArtifactPath = path.resolve(__dirname, "../build/contracts/ZeroCapitalArbTrader.json");
const { abi: zeroCapitalArbTraderAbi, bytecode: zeroCapitalArbTraderBytecode } = JSON.parse(fs.readFileSync(zeroCapitalArbTraderArtifactPath, "utf8"));

// Configure console.log to write to output.log
const outputLogPath = path.join(__dirname, '..', 'output.log');
const logStream = fs.createWriteStream(outputLogPath, { flags: 'w' });
console.log = console.error = (...args) => { // Redirect both console.log and console.error
    const logEntry = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    logStream.write(`${logEntry}\n`);
    process.stdout.write(`${logEntry}\n`); // Keep writing to stdout for live feedback
};

async function deploy() {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        const providerUrl = process.env.PROVIDER_URL;
        const aavePoolAddressesProvider = process.env.AAVE_POOL_ADDRESSES_PROVIDER; // Load AAVE_POOL_ADDRESSES_PROVIDER

        if (!privateKey || !providerUrl || !aavePoolAddressesProvider) {
            throw new Error("Missing PRIVATE_KEY, PROVIDER_URL, or AAVE_POOL_ADDRESSES_PROVIDER in .env");
        }

        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const deployer = wallet.connect(provider);

        console.log("Deploying ArbTrader from address:", deployer.address);

        const factory = new ethers.ContractFactory(abi, bytecode, deployer);
        const contract = await factory.deploy(aavePoolAddressesProvider);
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();


        // Deploy ZeroCapitalArbTrader and pass ArbTrader contract address
        console.log("\nDeploying ZeroCapitalArbTrader from address:", deployer.address);
        const zeroCapitalArbTraderFactory = new ethers.ContractFactory(zeroCapitalArbTraderAbi, zeroCapitalArbTraderBytecode, deployer);
        const feeRecipientAddress = process.env.FEE_RECIPIENT_ADDRESS; // Load fee recipient address
        if (!feeRecipientAddress) {
            throw new Error("Missing FEE_RECIPIENT_ADDRESS in .env");
        }

        const initialNetworks = [0]; // Network.Ethereum = 0 (for Sepolia testnet in this example)
        const poolProviders = [process.env.AAVE_POOL_ADDRESSES_PROVIDER];
        const liquidityScores = [75]; // Example liquidity score for Sepolia

        const zeroCapitalArbTraderContract = await zeroCapitalArbTraderFactory.deploy(
            feeRecipientAddress,
            initialNetworks,
            poolProviders,
            liquidityScores
        );
        await zeroCapitalArbTraderContract.waitForDeployment();
        const zeroCapitalArbTraderContractAddress = await zeroCapitalArbTraderContract.getAddress();

        console.log("ArbTrader contract deployed to:", contractAddress);
        console.log("Deployment transaction:", contract.deploymentTransaction().hash);
        // Write contract address to output.log
        fs.writeFileSync(outputLogPath, `ArbTrader Contract Address: ${contractAddress}\n`, { flag: 'a' });

        console.log("ZeroCapitalArbTrader contract deployed to:", zeroCapitalArbTraderContractAddress);
        console.log("Deployment transaction:", zeroCapitalArbTraderContract.deploymentTransaction().hash);
        // Write contract address to output.log
        fs.writeFileSync(outputLogPath, `ZeroCapitalArbTrader Contract Address: ${zeroCapitalArbTraderContractAddress}\n`, { flag: 'a' });

        return {
            arbTraderAddress: contractAddress,
            zeroCapitalArbTraderAddress: zeroCapitalArbTraderContractAddress
        };

    } catch (error) {
        console.error("Deployment failed:", error);
        throw error; // Re-throw error for handling in .catch
    }
}

deploy()
    .then(contracts => {
        console.log(`Deployment successful.`);
        console.log(`ArbTrader Contract Address: ${contracts.arbTraderAddress}`);
        console.log(`ZeroCapitalArbTrader Contract Address: ${contracts.zeroCapitalArbTraderAddress}`);
        logStream.end(() => process.exit(0));
    })
    .catch(error => {
        console.error("Deployment error:", error);
        logStream.end(() => process.exit(1)); // End the log stream before exiting on error
    });
