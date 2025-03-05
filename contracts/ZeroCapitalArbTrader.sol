// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {Pool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {FlashLoanReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract ZeroCapitalArbTrader is FlashLoanReceiverBase {
    address public arbTraderContractAddress;

    constructor(IPoolAddressesProvider provider, address _arbTraderContractAddress) FlashLoanReceiverBase(provider) {
        arbTraderContractAddress = _arbTraderContractAddress;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator
    ) external override returns (bool) {
        // 1. Receive flash loaned funds (already in contract)

        // 2. Execute arbitrage trade
        // TODO: Integrate trade execution logic here using 'ArbTrader' contract
        // Example: Call ArbTrader functions to execute trade

        // 3. Calculate repayment amount (loaned amount + premium)
        uint256 totalRepayment = amounts[0] + premiums[0]; // Assuming single asset flash loan

        // 4. Approve and repay flash loan to Aave
        IERC20(assets[0]).approve(address(POOL), totalRepayment);
        Pool(address(POOL)).repay(assets[0], totalRepayment, 2, address(this)); // referralCode = 2 (Aave docs)

        // 5. Handle profit (transfer to owner or designated wallet)
        // TODO: Implement profit calculation and transfer

        return true; // Indicate operation success
    }

    function requestFlashLoan(address asset, uint256 amount) external {
        address receiverAddress = address(this);
        address[] memory assets = new address[](1);
        assets[0] = asset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        uint256 referralCode = 0;
        address initiator = address(this); // Contract itself is initiator

        POOL.flashLoan(receiverAddress, assets, amounts, referralCode, initiator);
    }

    receive() external payable {}
}
