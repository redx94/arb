// scripts/deploy.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const ethers = require('ethers');

// Load compiled contract artifact
const artifactPath = path.resolve(__dirname, "../build/contracts/HelloWorld.json"); // Deploy HelloWorld
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function deploy() {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        const providerUrl = process.env.PROVIDER_URL;

        if (!privateKey || !providerUrl) {
            throw new Error("Missing PRIVATE_KEY, PROVIDER_URL in .env");
        }

        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const deployer = wallet.connect(provider);

        console.log("Deploying HelloWorld from address:", deployer.address); // Indicate HelloWorld deployment

        const factory = new ethers.ContractFactory(abi, bytecode, deployer);
        const contract = await factory.deploy(); // Deploy HelloWorld - no constructor args

        await contract.waitForDeployment();

        console.log("HelloWorld contract deployed to:", contract.target); // Indicate HelloWorld deployment
        console.log("Deployment transaction:", contract.deploymentTransaction().hash);

    } catch (error) {
        console.error("HelloWorld deployment failed:", error); // Indicate HelloWorld deployment failure
        process.exit(1);
    }
}

deploy().catch(error => console.error("Deployment error:", error));
