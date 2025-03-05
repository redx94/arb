// migrations/3_deploy_arb_trader.js
const ArbTrader = artifacts.require("ArbTrader");
const MockPoolAddressesProvider = artifacts.require("MockPoolAddressesProvider");

module.exports = async function (deployer) {
  const poolAddressesProviderAddress = "0xc4dCB5136aD3Bad98e14Ed3F73E50888D04fa40d"; // Aave V3 Goerli PoolAddressesProvider

  // Deploy ArbTrader, passing the real PoolAddressesProvider address
  await deployer.deploy(ArbTrader, poolAddressesProviderAddress);
};
