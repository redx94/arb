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
    uint256 public constant PRICE_DECIMALS = 18;
    uint256 public constant SWAP_DEADLINE_OFFSET = 300; // 5 minutes
    uint256 public constant UNISWAP_FEE_BASIS_POINTS = 30; // 0.3%
    uint256 public constant SUSHISWAP_FEE_BASIS_POINTS = 30; // 0.3%

    address public immutable UNISWAP_ROUTER;
    address public immutable SUSHISWAP_ROUTER;
    address public immutable WETH;
    bool private ethArbOpportunity = false; // Flag for ETH arbitrage opportunity
    string private ethTradeDirection; // ETH trade direction
    uint256 private ethArbProfit; // To store ETH arbitrage profit
    bool private btcArbOpportunity = false; // Flag for BTC arbitrage opportunity
    string private btcTradeDirection; // BTC trade direction
    uint256 private btcArbProfit; // To store BTC arbitrage profit

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

        // Calculate price: (WETH reserve / Token reserve) * 10**PRICE_DECIMALS
        return (wethReserve * 10**PRICE_DECIMALS) / tokenReserve;
    }

    function getUniswapPrice(address token) public view returns (uint256) {
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
        return getDexPrice(token, uniswapRouter);
    }

    function getSushiswapPrice(address token) public view returns (uint256) {
        IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
        return getDexPrice(token, sushiswapRouter);
    }

    function getLatestEthPrice() private view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = ethUsdPriceFeed.latestRoundData();
        return price;
    }

    function getLatestBtcPrice() private view returns (int256) {
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

        // 1. Get CEX and DEX prices upfront
        int256 ethPriceCex = getLatestEthPrice();
        int256 btcPriceCex = getLatestBtcPrice();
        uint256 ethPriceDexUniswap = getUniswapPrice(WETH);
        uint256 ethPriceDexSushiswap = getSushiswapPrice(WETH);
        uint256 btcPriceDexUniswap = getUniswapPrice(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599); // WBTC address
        uint256 btcPriceDexSushiswap = getSushiswapPrice(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599); // WBTC address

        // 2. Determine arbitrage opportunity and trade direction for ETH
        ethArbOpportunity = ethPriceDexUniswap > ethPriceDexSushiswap || ethPriceDexSushiswap > ethPriceDexUniswap;
        ethTradeDirection = ethPriceDexUniswap > ethPriceDexSushiswap ? "Buy Sushiswap, Sell Uniswap" : "Buy Uniswap, Sell Sushiswap";

        // 3. Determine arbitrage opportunity and trade direction for BTC
        btcArbOpportunity = btcPriceDexUniswap > btcPriceDexSushiswap || btcPriceDexSushiswap > btcPriceDexUniswap;
        btcTradeDirection = btcPriceDexUniswap > btcPriceDexSushiswap ? "Buy Sushiswap, Sell Uniswap" : "Buy Uniswap, Sell Sushiswap";

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
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                uint256 initialAmount = amounts[0]; 

                uniswapRouter.swapExactTokensForTokens(amounts[0], 0, pathUniswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 wethAmountFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap)[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * UNISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;

                sushiswapRouter.swapExactTokensForTokens(wethAmountAfterUniswapFee, 0, pathSushiswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 amountOut = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap)[1];
                uint256 sushiswapSwapFee = (amountOut * SUSHISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;
                ethArbProfit = amountOutAfterFees - initialAmount;
                console.log("ETH Arbitrage Profit (Buy Uniswap, Sell Sushiswap):", ethArbProfit);

            } else if (keccak256(bytes(ethTradeDirection)) == keccak256(bytes("Buy Sushiswap, Sell Uniswap"))) {
                // --- Buy on Sushiswap, Sell Uniswap --- 
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                uint256 initialAmount = amounts[0]; 

                sushiswapRouter.swapExactTokensForTokens(amounts[0], 0, pathSushiswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 wethAmountFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap)[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * SUSHISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;

                uniswapRouter.swapExactTokensForTokens(wethAmountAfterSushiswapFee, 0, pathUniswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 amountOut = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap)[1];
                uint256 uniswapSwapFee = (amountOut * UNISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;
                ethArbProfit = amountOutAfterFees - initialAmount;
                console.log("ETH Arbitrage Profit (Buy Sushiswap, Sell Uniswap):", ethArbProfit);
            }
        }

        if (btcArbOpportunity) {
             if (keccak256(bytes(btcTradeDirection)) == keccak256(bytes("Buy Uniswap, Sell Uniswap"))) {
                // --- Buy on Uniswap, Sell Sushiswap --- 
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                uint256 initialAmount = amounts[0]; 

                uniswapRouter.swapExactTokensForTokens(amounts[0], 0, pathUniswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 wethAmountFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap)[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * UNISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;

                sushiswapRouter.swapExactTokensForTokens(wethAmountAfterUniswapFee, 0, pathSushiswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 amountOut = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap)[1];
                uint256 sushiswapSwapFee = (amountOut * SUSHISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit (Buy Uniswap, Sell Sushiswap):", btcArbProfit);

             } else if (keccak256(bytes(btcTradeDirection)) == keccak256(bytes("Buy Sushiswap, Sell Uniswap"))) {
                // --- Buy on Sushiswap, Sell Uniswap ---
                IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
                IUniswapV2Router02 sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER);
                uint256 initialAmount = amounts[0]; 

                sushiswapRouter.swapExactTokensForTokens(amounts[0], 0, pathSushiswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 wethAmountFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap)[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * SUSHISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;

                uniswapRouter.swapExactTokensForTokens(wethAmountAfterSushiswapFee, 0, pathUniswap, address(this), block.timestamp + SWAP_DEADLINE_OFFSET);
                uint256 amountOut = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap)[1];
                uint256 uniswapSwapFee = (amountOut * UNISWAP_FEE_BASIS_POINTS) / 10000;
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit (Buy Sushiswap, Sell Uniswap):", btcArbProfit);
            }
        }

        // 5. Execute CEX trade (Binance order) - Placeholder - Binance trade execution not implemented
        executeBinanceTrade();
        console.log("Executing Binance trade - Placeholder");

        function executeBinanceTrade() private {
            // Binance trade execution not implemented
            console.log("Binance trade execution not implemented");
        }

        // 6. Calculate profit (consider fees and flash loan premium)
        uint256 flashLoanPremium = (amounts[0] * premiums[0]) / 10000;
        uint256 totalCost = amounts[0] + flashLoanPremium;
        uint256 profit = 0; // Implement actual profit calculation

        if (ethArbOpportunity) {
            profit = ethArbProfit - totalCost;
        } else if (btcArbOpportunity) {
            profit = btcArbProfit - totalCost;
        console.log("Flash Loan Premium:", flashLoanPremium);
        console.log("Total Cost (Loan + Premium):", totalCost);
        console.log("Net Profit:", profit);

        if (ethArbOpportunity) {
            profit = ethArbProfit - flashLoanPremium; // Consider flash loan premium
        } else if (btcArbOpportunity) {
            profit = btcArbProfit - flashLoanPremium; // Consider flash loan premium
        }

        // 7. Repay flash loan (Aave base contract handles this) - Aave repayment is handled

        // 8. Transfer net profit to owner
        if (profit > 0) {
            transferProfit(profit);
        }

        return true; // Indicate operation success
    }

    function transferProfit(uint256 _profit) private {
        // Transfer net profit to owner
        (bool success, ) = owner.call{value: _profit}("");
        require(success, "Profit transfer failed");
        console.log("Profit transferred to owner:", _profit);
    }
