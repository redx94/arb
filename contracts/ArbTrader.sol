// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ArbTrader: Optimized Arbitrage Trading Contract
/// @notice This contract enables the owner to deposit funds, execute arbitrage trades,
///         and withdraw profits while ensuring minimal gas usage and robust security.
contract ArbTrader is Ownable, ReentrancyGuard {
    // --- Events ---
    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    event ArbitrageExecuted(address indexed executor, uint256 profit);

    // --- Modifiers ---
    modifier nonZero(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    // --- Functions ---

    /// @notice Allows users to deposit ETH into the contract.
    function deposit() external payable nonZero(msg.value) {
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraws a specified amount of ETH; only callable by the owner.
    /// @param amount The amount to withdraw.
    function withdraw(uint256 amount) external onlyOwner nonReentrant nonZero(amount) {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Executes an arbitrage operation by performing a low-level call to a target contract.
    /// @param target The address of the target contract where arbitrage logic resides.
    /// @param data The calldata containing the arbitrage instructions.
    /// @return success Returns true if the arbitrage call succeeded.
    /// @dev Implement your specific arbitrage strategy logic as needed.
    function executeArbitrage(address target, bytes calldata data)
        external
        onlyOwner
        nonReentrant
        returns (bool success)
    {
        require(isContract(target), "Target must be a contract");

        // Perform a low-level call with the entire balance.
        (bool callSuccess, ) = target.call{value: address(this).balance}(data);
        require(callSuccess, "Arbitrage call failed");

        // Placeholder for profit calculation logic; replace with your actual strategy.
        uint256 profit = address(this).balance;
        emit ArbitrageExecuted(msg.sender, profit);
        return true;
    }

    /// @notice Determines if an address is a contract.
    /// @param addr The address to check.
    /// @return True if the address contains code, false otherwise.
    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    // --- Fallback Functions ---
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}
