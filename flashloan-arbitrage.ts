import { ethers } from "ethers";
import { FlashLoanProvider } from "./flashloanProvider";

const executeFlashLoan = async () => {
    const flashloanProvider = new FlashLoanProvider(\"AAVE_V3\");
    await flashloanProvider.executeArbitrage({
        loanAmount: \"1000000\",
        tokens: ["WETH", "USDC"],
        dexRoutes: ["Uniswap", "SushiSwap"],
    });
};

executeFlashLoan().catch(console.error);