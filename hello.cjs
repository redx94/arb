const ethers = require('ethers');

async function main() {
    try {
        const provider = new ethers.providers.JsonRpcProvider("https://cloudflare-eth.com");
        provider.getNetwork().then((network) => {
            console.log("Network:", network);
        }).catch((error) => {
            console.error("Error getting network:", error);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
