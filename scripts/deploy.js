async function main() {
  const FlashLoanArbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  const flashLoan = await FlashLoanArbitrage.deploy(feeRecipient);
  await flashLoan.deployed();
  console.log("Contract deployed to:", flashLoan.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
