// migrations/3_deploy_arb_trader.js
const ArbTrader = artifacts.require("ArbTrader");

module.exports = function (deployer) {
  deployer.deploy(ArbTrader);
};
