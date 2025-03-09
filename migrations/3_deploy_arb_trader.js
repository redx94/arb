// migrations/3_deploy_arb_trader.js
const FlashLoanArbitrage = artifacts.require("FlashLoanArbitrage");

module.exports = async function (deployer, network, accounts) {
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;

  await deployer.deploy(FlashLoanArbitrage, feeRecipient);
};
