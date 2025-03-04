// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol"; // Import IPoolAddressesProvider
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FlashLoanReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol"; // Import IPool interface

contract ArbTrader is FlashLoanReceiverBase {
    address payable public owner;

    constructor(IPoolAddressesProvider _poolAddressesProvider) FlashLoanReceiverBase(_poolAddressesProvider) { // Use IPoolAddressesProvider
        owner = payable(msg.sender);
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) { // Removed payable keyword
        // 1. Execute arbitrage trade logic here (DEX/CEX interactions would be complex in a contract)
        // For now, placeholder logic: transfer flashloaned amount back + profit to owner

        // Assume profit is calculated elsewhere and passed in 'params' (for simplicity in this example)
        uint256 profit = abi.decode(params, (uint256));

        // Repay flash loan (principal + premium) - Aave base contract handles this

        // Transfer profit to owner
        payable(owner).transfer(profit);

        return true; // Indicate operation success
    }

    function requestFlashLoan(address _asset, uint256 _amount) external {
        address[] memory assets = new address[](1);
        assets[0] = _asset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;
        uint256 referralCode = 0;
        bytes memory params = abi.encode(uint256(1 ether)); // Example: Pass in 1 ether profit for simplicity
        uint256[] memory interestRateModes = new uint256[](1); // Add interestRateModes
        interestRateModes[0] = 0; // Default interest rate mode

        POOL.flashLoan(
            address(this),         // receiverAddress
            assets,                // assets
            amounts,               // amounts
            interestRateModes,     // interestRateModes - ADDED
            address(this),         // onBehalfOf - using contract itself as onBehalfOf
            params,                // params - ADDED
            uint16(referralCode)  // referralCode - cast to uint16
        );
    }

    receive() external payable {}
}
