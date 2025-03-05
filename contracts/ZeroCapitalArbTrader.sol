// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {Pool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {FlashLoanReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IUniswapV2Router02} from './interfaces/IUniswapV2Router02.sol';
import {IUniswapV2Pair} from './interfaces/IUniswapV2Pair.sol'; // Import Uniswap Pair interface
import "hardhat/console.sol";

contract ZeroCapitalArbTrader is FlashLoanReceiverBase {
    address payable public owner;
    address public UNISWAP_ROUTER;
    address public SUSHISWAP_ROUTER; // Sushiswap Router address (Goerli)
    address public WETH; // WETH address
    uint256 public ethArbProfit; // To store ETH arbitrage profit
    uint256 public btcArbProfit; // To store BTC arbitrage profit
    string public ethTradeDirection;
    string public btcTradeDirection;
    bool public ethArbOpportunity;
    bool public btcArbOpportunity;

    constructor(
        IPoolAddressesProvider provider,
        address _uniswapRouter,
        address _sushiswapRouter,
        address _weth
    ) FlashLoanReceiverBase(provider) {
        owner = payable(msg.sender);
        UNISWAP_ROUTER = _uniswapRouter;
        SUSHISWAP_ROUTER = _sushiswapRouter;
        WETH = _weth;
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

    // Function to get Sushiswap reserves and calculate price
    function getSushiswapPrice(address token) public view returns (uint256) {
        address pairAddress = getSushiswapPair(token);
        if (pairAddress == address(0)) {
            return 0; // Pair not found
        }
        IUniswapV2Pair sushiswapPair = IUniswapV2Pair(pairAddress);
        (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast) = sushiswapPair.getReserves();

        // Ensure WETH is reserve0 for consistent price calculation
        uint256 wethReserve = WETH < token ? reserve0 : reserve1;
        uint256 tokenReserve = WETH < token ? reserve1 : reserve0;

        if (tokenReserve == 0) {
            return 0; // Prevent division by zero
        }

        // Calculate price: (WETH reserve / Token reserve) * 10^18
        return (wethReserve * 10**18) / tokenReserve;
    }

    // Function to get Uniswap reserves and calculate price
    function getUniswapPrice(address token) public view returns (uint256) {
        address pairAddress = getUniswapPair(token);
        if (pairAddress == address(0)) {
            return 0; // Pair not found
        }
        IUniswapV2Pair uniswapPair = IUniswapV2Pair(pairAddress);
        (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast) = uniswapPair.getReserves();

        // Ensure WETH is reserve0 for consistent price calculation
        uint256 wethReserve = WETH < token ? reserve0 : reserve1;
        uint256 tokenReserve = WETH < token ? reserve1 : reserve0;

        if (tokenReserve == 0) {
            return 0; // Avoid division by zero
        }

        // Calculate price: (WETH reserve / Token reserve) * 10^18 (assuming 18 decimals for both)
        return (wethReserve * 10**18) / tokenReserve;
    }

    /* function getLatestEthPrice() public view returns (int256) {
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
            int26 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = btcUsdPriceFeed.latestRoundData();
        return price;
    } */

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        uint256 maxSlippage
    ) external override returns (bool) {

        // 1. Get CEX price (Binance via Chainlink) - Keep CEX prices for comparison
        // int256 ethPriceCex = getLatestEthPrice();
        // int256 btcPriceCex = getLatestBtcPrice();

        // 2. Get DEX prices (Uniswap V2 and Sushiswap)
        uint256 ethPriceDexUniswap = getUniswapPrice(WETH); // WETH price on Uniswap
        uint256 ethPriceDexSushiswap = getSushiswapPrice(WETH); // WETH price on Sushiswap
        address wbtc = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
        uint256 btcPriceDexUniswap = getUniswapPrice(wbtc); // WBTC price on Uniswap
        uint256 btcPriceDexSushiswap = getSushiswapPrice(wbtc); // WBTC price on Sushiswap

        // 3. Detect arbitrage opportunities - ETH
        if (ethPriceDexUniswap > 0 && ethPriceDexSushiswap > 0) {
            if (ethPriceDexUniswap > ethPriceDexSushiswap) {
                ethArbOpportunity = true;
                ethTradeDirection = "Buy Sushiswap, Sell Uniswap";
                console.log("ETH Arb Opportunity: Buy Sushiswap, Sell Uniswap");
            } else if (ethPriceDexSushiswap > ethPriceDexUniswap) {
                ethArbOpportunity = true;
                ethTradeDirection = "Buy Uniswap, Sell Sushiswap";
                console.log("ETH Arb Opportunity: Buy Uniswap, Sell Sushiswap");
            } else {
                ethArbOpportunity = false;
                ethTradeDirection = "No ETH Arb Opportunity";
                console.log("No ETH Arb Opportunity");
            }
        } else {
            ethArbOpportunity = false;
            ethTradeDirection = "No ETH Arb Opportunity: DEX prices not available";
            console.log("No ETH Arb Opportunity: DEX prices not available");
        }

        // 3. Detect arbitrage opportunities - BTC
        if (btcPriceDexUniswap > 0 && btcPriceDexSushiswap > 0) {
            if (btcPriceDexUniswap > btcPriceDexSushiswap) {
                btcArbOpportunity = true;
                btcTradeDirection = "Buy Sushiswap, Sell Uniswap";
                console.log("BTC Arb Opportunity: Buy Sushiswap, Sell Uniswap");
            } else if (btcPriceDexSushiswap > btcPriceDexUniswap) {
                btcArbOpportunity = true;
                btcTradeDirection = "Buy Uniswap, Sell Sushiswap";
                console.log("BTC Arb Opportunity: Buy Uniswap, Sell Sushiswap");
            } else {
                btcArbOpportunity = false;
                ethTradeDirection = "No BTC Arb Opportunity";
                console.log("No BTC Arb Opportunity");
            }
        } else {
            btcArbOpportunity = false;
            btcTradeDirection = "No BTC Arb Opportunity: DEX prices not available";
            console.log("No BTC Arb Opportunity: DEX prices not available");
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
                // --- Buy on Uniswap, Sell on Sushiswap ---
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


                // Calculate expected WETH output and fee from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap);
                uint256 wethAmountFromUniswap = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutUniswap = (wethAmountAfterUniswapFee * (10000 - maxSlippage)) / 10000;

                // Swap flashloaned tokens for WETH on Uniswap (Buy on Uniswap)
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap);
                uint256 wethAmountFromUniswap = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;
                uint256 minAmountOutUniswap = (wethAmountAfterUniswapFee * (10000 - maxSlippage)) / 10000;

                uniswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    minAmountOutUniswap, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Swap WETH back to tokens on Sushiswap (Sell on Sushiswap)
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap);
                uint256 amountOut = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;
                uint256 minAmountOutSushiswap = (amountOutAfterFees * (10000 - maxSlippage)) / 10000;

                sushiswapRouter.swapExactTokensForTokens(
                    wethAmountAfterUniswapFee, // Swap WETH amount after Uniswap fee
                    minAmountOutSushiswap, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate profit
                ethArbProfit = amountOutAfterFees - initialAmount;
                console.log("ETH Arbitrage Profit:", ethArbProfit);
                console.log("ETH Arbitrage Trade Direction:", ethTradeDirection);

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


                // Calculate expected WETH output from Sushiswap swap
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                uint256 wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutSushiswap = (wethAmountAfterSushiswapFee * (10000 - maxSlippage)) / 10000;

                // Swap flashloaned tokens for WETH on Sushiswap (Buy on Sushiswap)
                amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;
                minAmountOutSushiswap = (wethAmountAfterSushiswapFee * (10000 - maxSlippage)) / 10000;

                sushiswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    minAmountOutSushiswap, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate expected amountOut from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap);
                uint256 amountOut = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutUniswap = (amountOutAfterFees * (10000 - maxSlippage)) / 10000;

                // Swap WETH back to tokens on Uniswap (Sell on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    wethAmountAfterSushiswapFee, // Swap WETH amount from Sushiswap output
                    minAmountOutUniswap, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate profit
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit:", btcArbProfit);
                console.log("BTC Arbitrage Trade Direction:", btcTradeDirection);

                // --- End Buy on Sushiswap, Sell Uniswap ---
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


                // Calculate expected WETH output from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(amounts[0], pathUniswap);
                uint256 wethAmountFromUniswap = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (wethAmountFromUniswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterUniswapFee = wethAmountFromUniswap - uniswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutUniswap = (wethAmountAfterUniswapFee * (10000 - maxSlippage)) / 10000;

                // Swap flashloaned tokens for WETH on Uniswap (Buy on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    minAmountOutUniswap, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate expected amountOut from Sushiswap swap
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(wethAmountAfterUniswapFee, pathSushiswap);
                uint256 amountOut = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - sushiswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutSushiswap = (amountOutAfterFees * (10000 - maxSlippage)) / 10000;

                // Swap WETH back to tokens on Sushiswap (Sell on Sushiswap)
                sushiswapRouter.swapExactTokensForTokens(
                    wethAmountAfterUniswapFee, // Swap WETH amount from Uniswap output
                    minAmountOutSushiswap, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                // Calculate profit
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit:", btcArbProfit);
                console.log("BTC Arbitrage Trade Direction:", btcTradeDirection);

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


                // Calculate expected WETH output from Sushiswap swap
                uint256[] memory amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                uint256 wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                uint256 sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                uint256 wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutSushiswap = (wethAmountAfterSushiswapFee * (10000 - maxSlippage)) / 10000;

                // Swap flashloaned tokens for WETH on Sushiswap (Buy on Sushiswap)
                amountsOutFromSushiswap = sushiswapRouter.getAmountsOut(amounts[0], pathSushiswap);
                wethAmountFromSushiswap = amountsOutFromSushiswap[1];
                sushiswapSwapFee = (wethAmountFromSushiswap * 3) / 1000; // 0.3% fee
                wethAmountAfterSushiswapFee = wethAmountFromSushiswap - sushiswapSwapFee;
                minAmountOutSushiswap = (wethAmountAfterSushiswapFee * (10000 - maxSlippage)) / 10000;

                sushiswapRouter.swapExactTokensForTokens(
                    amounts[0],
                    minAmountOutSushiswap, // minAmountOut
                    pathSushiswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate expected amountOut from Uniswap swap
                uint256[] memory amountsOutFromUniswap = uniswapRouter.getAmountsOut(wethAmountAfterSushiswapFee, pathUniswap);
                uint256 amountOut = amountsOutFromUniswap[1];
                uint256 uniswapSwapFee = (amountOut * 3) / 1000; // 0.3% fee
                uint256 amountOutAfterFees = amountOut - uniswapSwapFee;

                // Calculate minAmountOut for slippage protection
                uint256 minAmountOutUniswap = (amountOutAfterFees * (10000 - maxSlippage)) / 10000;

                // Swap WETH back to tokens on Uniswap (Sell on Uniswap)
                uniswapRouter.swapExactTokensForTokens(
                    wethAmountAfterSushiswapFee, // Swap WETH amount from Sushiswap output
                    minAmountOutUniswap, // minAmountOut
                    pathUniswap,
                    address(this), // to: this contract
                    block.timestamp + 300 // deadline: 5 minutes
                );

                 // Calculate profit
                btcArbProfit = amountOutAfterFees - initialAmount;
                console.log("BTC Arbitrage Profit:", btcArbProfit);
                console.log("BTC Arbitrage Trade Direction:", btcTradeDirection);

                // --- End Buy Sushiswap, Sell Uniswap ---
            }
        }


        // 5. Calculate repayment amount (loaned amount + premium)
        uint256 totalRepayment = amounts[0] + premiums[0]; // Assuming single asset flash loan

        // 6. Approve and repay flash loan to Aave
        IERC20(assets[0]).approve(address(POOL), totalRepayment);
        Pool(address(POOL)).repay(assets[0], totalRepayment, 2, address(this)); // referralCode = 2 (Aave docs)

        // 7. Calculate net profit (gross profit - premium) - Net profit is calculated within trade execution

        // 8. Transfer net profit to owner
        payable(owner()).transfer(ethArbProfit + btcArbProfit); // Transfer both ETH and BTC profits

        return true; // Indicate operation success
    }

    function owner() public view returns (address) {
        return owner;
    }

    function requestFlashLoan(address asset, uint256 amount, uint256 maxSlippage) external {
        address receiverAddress = address(this);
        address[] memory assets = new address[](1);
        assets[0] = asset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        uint256 referralCode = 0;
        address initiator = address(this); // Contract itself is initiator

        POOL.flashLoan(receiverAddress, assets, amounts, referralCode, initiator);
        executeOperation(assets, amounts, new uint256[](1), initiator, maxSlippage);
    }

    receive() external payable {}
}
