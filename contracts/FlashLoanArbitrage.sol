pragma solidity ^0.8.0;

interface IDyDxSoloMargin {
    struct Action {
        uint8 actionType;
        uint256 accountId;
        uint256 amount;
        uint256 primaryMarketId;
        uint256 secondaryMarketId;
        address otherAddress;
        uint256 otherAccountId;
        bytes data;
    }
    function operate(address[] calldata accounts, Action[] calldata actions) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);
}

interface ICurvePool {
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract FlashLoanArbitrage {
    address public owner;
    IDyDxSoloMargin constant dydx = IDyDxSoloMargin(0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e); // Mainnet, mocked
    IUniswapV2Router constant uniswap = IUniswapV2Router(0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008); // Sepolia
    ICurvePool constant curve = ICurvePool(0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56);       // Mainnet, mocked
    address constant WETH = 0x7b79995e5f793a07bc00c21412e50ecae098e7f9; // Sepolia WETH
    address constant DAI = 0x3e622317f8c93f7328350cf0b56d9ed4c620c5d6;  // Sepolia DAI
    address public feeRecipient;

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    function executeFlashLoan(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        address[] memory accounts = new address[](1);
        accounts[0] = address(this);

        IDyDxSoloMargin.Action[] memory actions = new IDyDxSoloMargin.Action[](1);
        actions[0] = IDyDxSoloMargin.Action({
            actionType: 2,
            accountId: 0,
            amount: amount,
            primaryMarketId: 0,
            secondaryMarketId: 0,
            otherAddress: address(this),
            otherAccountId: 0,
            data: abi.encode(amount)
        });

        dydx.operate(accounts, actions);
    }

    function callFunction(address, bytes calldata data) external {
        require(msg.sender == address(dydx), "Only dYdX");
        uint256 amount = abi.decode(data, (uint256));

        IERC20(WETH).approve(address(uniswap), amount);
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = DAI;
        uint amountOutMin = (amount * 995) / 1000; // 0.5% slippage tolerance
        uint[] memory amounts = uniswap.swapExactTokensForTokens(amount, amountOutMin, path, address(this), block.timestamp + 60);

        uint256 daiAmount = amounts[1];
        require(IERC20(DAI).approve(address(curve), daiAmount), "DAI approval failed");
        uint256 wethOut = curve.exchange(0, 1, daiAmount, 0);

        uint256 repayAmount = amount + (amount * 2 / 10000);
        require(wethOut >= repayAmount, "Insufficient profit");
        uint256 profit = wethOut - repayAmount;
        uint256 fee = profit / 10; // 10% fee
        require(IERC20(WETH).transfer(feeRecipient, fee), "Fee transfer failed");
        require(IERC20(WETH).transfer(address(dydx), repayAmount), "Repayment failed");
        require(IERC20(WETH).transfer(owner, profit - fee), "Profit transfer failed");
    }

    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == owner, "Only owner");
        feeRecipient = _feeRecipient;
    }

    receive() external payable {}
}
