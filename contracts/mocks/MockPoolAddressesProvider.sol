// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPool {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external payable returns (bool);
}

interface IPoolAddressesProvider {
    function getPool() external view returns (IPool);
}

contract MockPoolAddressesProvider is IPoolAddressesProvider {
    address public dummyPoolAddress;

    constructor(address _dummyPoolAddress) {
        dummyPoolAddress = _dummyPoolAddress;
    }

    function getPool() external view override returns (IPool) {
        return IPool(IPool(dummyPoolAddress));
    }
}
