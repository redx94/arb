// migrations/3_deploy_arb_trader.js
const ZeroCapitalArbTrader = artifacts.require("ZeroCapitalArbTrader");

module.exports = async function (deployer) {
  const poolAddressesProviderAddress = "0xc4dCB5136aD3Bad98e14Ed3F73E50888D04fa40d"; // Aave V3 Goerli PoolAddressesProvider
  const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router address
  const sushiswapRouterAddress = "0x1b02dA8Cb0c097eB8D57A175caef81D10c8dcC0C"; // Sushiswap Router address
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address

  // Deploy ZeroCapitalArbTrader, passing the PoolAddressesProvider, Uniswap Router, Sushiswap Router, and WETH addresses
  await deployer.deploy(
    ZeroCapitalArbTrader,
    poolAddressesProviderAddress,
    uniswapRouterAddress,
    sushiswapRouterAddress,
    wethAddress
  );
};
