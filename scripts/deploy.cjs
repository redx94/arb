const FlashLoanArbitrage = artifacts.require("FlashLoanArbitrage");

module.exports = async function (deployer) {
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;

  await deployer.deploy(FlashLoanArbitrage, feeRecipient);
};
