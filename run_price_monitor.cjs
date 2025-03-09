const ethers = require('ethers');

// Load environment variables
require('dotenv').config();

// Ethereum Mainnet Provider
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/" + process.env.INFURA_PROJECT_ID);

// Addresses from ZeroCapitalArbTrader.sol
const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const SUSHISWAP_ROUTER = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

// Factory Addresses
const UNISWAP_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const SUSHISWAP_FACTORY = ethers.utils.getAddress('0xC0AEe478e3658e2610c5F4A3A1473F7557dc78d3');


const TOKENS = [WBTC]; // Focus on just WBTC for simplicity
const TOKEN_SYMBOLS = ['WBTC'];

const ERC20_ABI = ["function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)","function factory() external view returns (address)"];
const FACTORY_ABI = ["function getPair(address tokenA, address tokenB) external view returns (address pair)"];

async function getPairPrice(pairAddress, tokenAddress, dexName) {
    if (pairAddress === ethers.ZeroAddress) {
        console.log(dexName + " Pair not found");
        return 0;
    }
    const pairContract = new ethers.Contract(pairAddress, ERC20_ABI, provider);
    try {
        const reserves = await pairContract.getReserves();
        let wethReserve, tokenReserve;
        if (WETH.toLowerCase() < tokenAddress.toLowerCase()) {
            wethReserve = reserves[0];
            tokenReserve = reserves[1];
        } else {
            wethReserve = reserves[1];
            tokenReserve = reserves[0];
        }
        if (tokenReserve.eq(0)) {
            console.log(dexName + " Reserve is 0");
            return 0;
        }
        return wethReserve.mul(ethers.parseEther("1")).div(tokenReserve); // Price in WETH
    } catch (error) {
        console.error("Error fetching price from " + dexName + ":", error);
        return 0;
    }
}

async function main() {
    console.log("Price monitor started...");

    const uniswapFactory = new ethers.Contract(UNISWAP_FACTORY, FACTORY_ABI, provider);
    const sushiswapFactory = new ethers.Contract(SUSHISWAP_FACTORY, FACTORY_ABI, provider);

    async function monitorPrices() {
        console.log("Fetching DEX prices...");

        for (let i = 0; i < TOKENS.length; i++) {
            const token = TOKENS[i];
            const symbol = TOKEN_SYMBOLS[i];

            const uniswapPairAddress = await uniswapFactory.getPair(WETH, token);
            const sushiswapPairAddress = await sushiswapFactory.getPair(WETH, token);

            const uniswapPrice = await getPairPrice(uniswapPairAddress, token, "Uniswap");
            const sushiswapPrice = await getPairPrice(sushiswapPairAddress, token, "Sushiswap");

            console.log('Token Pair: WETH/' + symbol);
            console.log('  Uniswap Price: ' + ethers.formatEther(uniswapPrice));
            console.log('  Sushiswap Price: ' + ethers.formatEther(sushiswapPrice));
            console.log("---");
        }

        setTimeout(monitorPrices, 5000); 
    }

    monitorPrices(); // Start initial price monitoring
}

main().catch((error) => {
    console.error("Error:", error);
});
