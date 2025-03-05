// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FlashLoanReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IUniswapV2Router02} from './interfaces/IUniswapV2Router02.sol';
import {IUniswapV2Pair} from './interfaces/IUniswapV2Pair.sol'; // Import Uniswap Pair interface
import {AggregatorV3Interface} from "node_modules/@chainlink/contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import { ReentrancyGuard } from "node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract ArbTrader is FlashLoanReceiverBase, ReentrancyGuard {
    address payable public owner;

    address public immutable UNISWAP_ROUTER;
    address public immutable SUSHISWAP_ROUTER;
    address public immutable WETH;
    bool public ethArbOpportunity = false; // Flag for ETH arbitrage opportunity
    string public ethTradeDirection; // ETH trade direction
    uint256 public ethArbProfit; // To store ETH arbitrage profit
    bool public btcArbOpportunity = false; // Flag for BTC arbitrage opportunity
    string public btcTradeDirection; // BTC trade direction
    uint256 public btcArbProfit; // To store BTC arbitrage profit

    // Chainlink Price Feed addresses
    AggregatorV3Interface internal ethUsdPriceFeed;
    AggregatorV3Interface internal btcUsdPriceFeed;

    constructor(
        IPoolAddressesProvider _poolAddressesProvider,
        address _uniswapRouter,
        address _sushiswapRouter,
        address _weth,
        address _ethUsdPriceFeed,
        address _btcUsdPriceFeed
    ) FlashLoanReceiverBase(_poolAddressesProvider) {
        owner = payable(msg.sender);
        UNISWAP_ROUTER = _uniswapRouter;
        SUSHISWAP_ROUTER = _sushiswapRouter;
        WETH = _weth;
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        btcUsdPriceFeed = AggregatorV3Interface(_btcUsdPriceFeed);
    }

    // Function to get Uniswap V2 Pair address for a token pair (e.g., WETH/Token)
    function getUniswapPair(address token) public view returns (address) {
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
        address pairAddress = uniswapRouter.getPair(WETH, token);
        return pairAddress;
    }

    // Function to get Sushiswap V2 Pair address for a token pair (e.g., WETH/Token)
    function getSushiswapPair(address token) public view returns (address) {
        IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
        address pairAddress = sushiswapRouter.getPair(WETH, token);
        return pairAddress;
    }

    // Function to get reserves and calculate price from a DEX Pair
    function getDexPrice(address token, IUniswapV2Router02 dexRouter) private view returns (uint256) {
        address pairAddress = dexRouter.getPair(WETH, token);
        require(pairAddress != address(0), "Dex: Pair not found");
        IUniswapV2Pair dexPair = IUniswapV2Pair(pairAddress);
        (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast) = dexPair.getReserves();

        // Ensure WETH is reserve0 for consistent price calculation
        uint256 wethReserve = WETH < token ? reserve0 : reserve1;
        uint256 tokenReserve = WETH < token ? reserve1 : reserve0;

        require(tokenReserve > 0, "Dex: Token reserve is zero");

        // Calculate price: (WETH reserve / Token reserve) * 10^18
        return (wethReserve * 10**18) / tokenReserve;
    }

    function getUniswapPrice(address token) public view returns (uint256) {
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
        return getDexPrice(token, uniswapRouter);
    }

    function getSushiswapPrice(address token) public view returns (uint256) {
        IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
        return getDexPrice(token, sushiswapRouter);
    }

    function getLatestEthPrice() public view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = ethUsdPriceFeed.latestRoundData();
        return price;
    }

    function getLatestBtcPrice() public view returns (int256) {
        (
            uint80 roundID, 
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = btcUsdPriceFeed.latestRoundData();
        return price;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override nonReentrant returns (bool) {
        // Input validation
        require(assets.length == 1, "Invalid assets length");
        require(amounts.length == 1, "Invalid amounts length");
        require(assets[0] != address(0), "Invalid asset address");

        // 1. Get CEX price (Binance via Chainlink) - Keep CEX prices for comparison
        int256 ethPriceCex = getLatestEthPrice();
        int256 btcPriceCex = getLatestBtcPrice();

        // 2. Get DEX prices (Uniswap V2 and Sushiswap)
        uint256 ethPriceDexUniswap = getUniswapPrice(WETH);
        uint256 ethPriceDexSushiswap = getSushiswapPrice(WETH);
        uint256 btcPriceDexUniswap = getUniswapPrice(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599); // WBTC address
        uint256 btcPriceDexSushiswap = getSushiswapPrice(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599); // WBTC address

        // 3. Determine arbitrage opportunity and trade direction for ETH
        if (ethPriceDexUniswap > ethPriceDexSushiswap) {
            ethArbOpportunity = true;
            ethTradeDirection = "Buy Sushiswap, Sell Uniswap";
        } else if (ethPriceDexSushiswap > ethPriceDexUniswap) {
            ethArbOpportunity = true;
            ethTradeDirection = "Buy Uniswap, Sell Sushiswap";
        } else {
            ethArbOpportunity = false;
        }

        // 3. Determine arbitrage opportunity and trade direction for BTC
        if (btcPriceDexUniswap > btcPriceDexSushiswap) {
            btcArbOpportunity = true;
            btcTradeDirection = "Buy Sushiswap, Sell Uniswap";
        } else if (btcPriceDexSushiswap > btcPriceDexUniswap) {
            btcArbOpportunity = true;
            btcTradeDirection = "Buy Uniswap, Sell Sushiswap";
        } else {
            btcArbOpportunity = false;
        }


        console.log("CEX ETH Price:", ethPriceCex);
        console.log("Uniswap DEX ETH Price:", ethPriceDexUniswap);
        console.log("Sushiswap DEX ETH Price:", ethPriceDexSushiswap);
        console.log("CEX BTC Price:", btcPriceCex);
        console.log("Uniswap DEX BTC Price:", btcPriceDexUniswap);
        console.log("Sushiswap DEX BTC Price:", btcPriceDexSushiswap);


        // 4. Execute DEX-to-DEX trade (Uniswap <-> Sushiswap)
        if (ethArbOpportunity) {
            if (keccak256(bytes(ethTradeDirection)) == keccak256(bytes("Buy Uniswap, Sell Sushiswap"))) {
                // --- Buy on Uniswap, Sell Sushiswap ---
                uint256 amountToSwap = amounts[0]; // Amount to swap (e.g., flashloaned amount)
                address tokenToSwap = assets[0]; // Token to swap (e.g., flashloaned token)
                address wethAddress = WETH;
                uint256 initialAmount = amounts[0]; // Store initial amount for profit calculation

                // Path for Uniswap swap (Token -> WETH)
                address[] memory pathUniswap = new address[](2);
                pathUniswap[0] = tokenToSwap;
                pathUniswap[1] = wethAddress;

                // Path for Sushiswap swap (WETH -> Token)
                address[] memory pathSushiswap = new address[](2);
                pathSushiswap[0] = wethAddress;
                pathSushiswap[1] = tokenToSwap;


                // Get Uniswap Router instance
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                // Get Sushiswap Router instance
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);


                // Swap flashloaned tokens for WETH on Uniswap (Buy on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    0, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate expected WETH output and fee from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap);
                uint256 wethAmountFromUniswap = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;


                // Swap WETH back to tokens on Sushiswap (Sell on Sushiswap)
                sushiswapRouter.swapExactTokensForTokens(
                    wethAmountAfterUniswapFee, // Swap WETH amount from Uniswap output
                    0, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate profit
                uint256 amountOut = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap)[1]; // Get tokens back from Sushiswap
                uint256 sushiswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;
                ethArbProfit = amountOutAfterFees - initialAmount;
                console.log("ETH Arbitrage Profit:", ethArbProfit);

                // Return profit
                return true;

                // --- End Buy Uniswap, Sell Sushiswap ---
            } else if (keccak256(bytes(ethTradeDirection)) == keccak256(bytes("Buy Sushiswap, Sell Uniswap"))) {
                // --- Buy on Sushiswap, Sell Uniswap ---
                uint256 amountToSwap = amounts[0]; // Amount to swap (e.g., flashloaned amount)
                address tokenToSwap = assets[0]; // Token to swap (e.g., flashloaned token)
                address wethAddress = WETH;
                uint256 initialAmount = amounts[0]; // Store initial amount for profit calculation


                // Path for Sushiswap swap (Token -> WETH)
                address[] memory pathSushiswap = new address[](2);
                pathSushiswap[0] = tokenToSwap;
                pathSushiswap[1] = wethAddress;

                // Path for Uniswap swap (WETH -> Token)
                address[] memory pathUniswap = new address[](2);
                pathUniswap[0] = wethAddress;
                pathUniswap[1] = tokenToSwap;


                // Get Sushiswap Router instance
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                // Get Uniswap Router instance
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);


                // Swap flashloaned tokens for WETH on Sushiswap (Buy on Sushiswap)
                sushiswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    0, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate expected WETH output from Sushiswap swap
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                uint256 wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;


                // Swap WETH back to tokens on Uniswap (Sell on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    wethAmountAfterSushiswapFee, // Swap WETH amount from Sushiswap output
                    0, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate profit
                uint256 amountOut = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap)[1]; // Get tokens back from Uniswap
                uint256 uniswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;
                ethArbProfit = amountOutAfterFees - initialAmount;
                console.log("ETH Arbitrage Profit:", ethArbProfit);

                // Return profit
                return true;
                // --- End Buy Sushiswap, Sell Uniswap ---
            }
        }


        if (btcArbOpportunity) {
             if (keccak256(bytes(btcTradeDirection)) == keccak256(bytes("Buy Uniswap, Sell Sushiswap"))) {
                // --- Buy on Uniswap, Sell Sushiswap ---
                uint256 amountToSwap = amounts[0]; // Amount to swap (e.g., flashloaned amount)
                address tokenToSwap = assets[0]; // Token to swap (e.g., flashloaned token)
                address wethAddress = WETH;
                uint256 initialAmount = amounts[0]; // Store initial amount for profit calculation


                // Path for Uniswap swap (Token -> WETH)
                address[] memory pathUniswap = new address[](2);
                pathUniswap[0] = tokenToSwap;
                pathUniswap[1] = wethAddress;

                // Path for Sushiswap swap (WETH -> Token)
                address[] memory pathSushiswap = new address[](2);
                pathSushiswap[0] = wethAddress;
                pathSushiswap[1] = tokenToSwap;


                // Get Uniswap Router instance
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                // Get Sushiswap Router instance
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);


                // Swap flashloaned tokens for WETH on Uniswap (Buy on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    0, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate expected WETH output and fee from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap);
                uint256 wethAmountFromUniswap = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;


                // Swap WETH back to tokens on Sushiswap (Sell on Sushiswap)
                sushiswapRouter.swapExactTokensForTokens(
                    wethAmountAfterUniswapFee, // Swap WETH amount from Uniswap output
                    0, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate profit
                uint256 amountOut = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap)[1]; // Get tokens back from Sushiswap
                uint256 sushiswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit:", btcArbProfit);

                // Return profit
                return true;

                // --- End Buy Uniswap, Sell Sushiswap ---
            } else if (keccak256(bytes(btcTradeDirection)) == keccak256(bytes("Buy Sushiswap, Sell Uniswap"))) {
                // --- Buy on Sushiswap, Sell Uniswap ---
                uint256 amountToSwap = amounts[0]; // Amount to swap (e.g., flashloaned amount)
                address tokenToSwap = assets[0]; // Token to swap (e.g., flashloaned token)
                address wethAddress = WETH;
                uint256 initialAmount = amounts[0]; // Store initial amount for profit calculation


                // Path for Sushiswap swap (Token -> WETH)
                address[] memory pathSushiswap = new address[](2);
                pathSushiswap[0] = tokenToSwap;
                pathSushiswap[1] = wethAddress;

                // Path for Uniswap swap (WETH -> Token)
                address[] memory pathUniswap = new address[](2);
                pathUniswap[0] = wethAddress;
                pathUniswap[1] = tokenToSwap;


                // Get Sushiswap Router instance
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                // Get Uniswap Router instance
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);


                // Swap flashloaned tokens for WETH on Sushiswap (Buy on Sushiswap)
                sushiswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    0, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate expected WETH output from Sushiswap swap
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                uint256 wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;


                // Swap WETH back to tokens on Uniswap (Sell on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    wethAmountAfterSushiswapFee, // Swap WETH amount from Sushiswap output
                    0, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate profit
                uint256 amountOut = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap)[1]; // Get tokens back from Uniswap
                uint256 uniswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit:", btcArbProfit);

                // Return profit
                return true;
                // --- End Buy Sushiswap, Sell Uniswap ---
            }
        }


        // 5. Execute CEX trade (Binance order) - Placeholder - Keep placeholder comment
        // TODO: Implement Binance trade execution logic (off-chain or further on-chain integration)
        // Binance trade execution is not implemented in this version.

        // 6. Calculate profit (consider fees and flash loan premium)
        uint256 flashLoanPremium = (amounts[0] * premiums[0]) / 10000; // Premium is in basis points (1/10000)
        uint256 totalCost = amounts[0] + flashLoanPremium;
        uint256 profit = 0;

        if (ethArbOpportunity) {
            profit = ethArbProfit > totalCost ? ethArbProfit - totalCost : 0;
        } else if (btcArbOpportunity) {
            profit = btcArbProfit > totalCost ? btcArbProfit - totalCost : 0;
        }

        console.log("Flash Loan Premium:", flashLoanPremium);
        console.log("Total Cost (Loan + Premium):", totalCost);
        console.log("Net Profit:", profit);

        // 7. Repay flash loan (Aave base contract handles this) - Aave repayment is handled

        // 8. Transfer net profit to owner
        if (profit > 0) {
            transferProfit(profit);
        }

        return true; // Indicate operation success
    }

    function requestFlashLoan(address _asset, uint256 _amount) external {
        address[] memory assets = new address[](1);
        assets[0] = _asset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;
        uint256 referralCode = 0;
        bytes memory params = abi.encode(uint256(1 ether)); // Example: Pass in 1 ether profit for simplicity
        uint256[] memory interestRateModes = new uint256[](1);
        interestRateModes[0] = 0;

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

    function transferProfit(uint256 _profit) private {
        (bool success, ) = owner.call{value: _profit}("");
        require(success, "Transfer failed.");
    }
}
