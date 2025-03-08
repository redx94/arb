// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {FlashLoanReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Pair} from "./interfaces/IUniswapV2Pair.sol";

contract ZeroCapitalArbTrader is FlashLoanReceiverBase {
    // Mainnet DEX addresses (Ethereum-specific for this example)
    address public constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant SUSHISWAP_ROUTER = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    // Network identifiers (simplified for demo; could use chainId in practice)
    enum Network { Ethereum, Polygon, Arbitrum, Optimism, Avalanche, Base, Scroll }
    
    // Struct to store network-specific data
    struct NetworkConfig {
        address poolProvider;
        uint256 liquidityScore; // Heuristic for "best" network (0-100)
        bool active;
    }

    address payable public owner;
    address payable public feeRecipient;
    uint256 public minProfitThreshold = 0.1 ether;
    uint256 public feePercentage = 100; // 1%
    bool public paused;
    uint256 private nonReentrantLock;
    mapping(address => uint256) public profits;
    mapping(address => bool) public approvedTokens;
    mapping(Network => NetworkConfig) public networkConfigs;
    Network[] public activeNetworks;

    event ArbitrageExecuted(Network indexed network, address indexed token, uint256 profit, uint256 fee, string direction, uint256 timestamp);
    event PriceData(Network indexed network, address indexed token, uint256 uniswapPrice, uint256 sushiswapPrice, uint256 priceDiff);
    event Paused(bool status);
    event FeeUpdated(uint256 newFee);
    event TokenApproval(address indexed token, bool status);
    event TradeFailed(Network indexed network, address indexed token, string reason);
    event NetworkUpdated(Network indexed network, address poolProvider, uint256 liquidityScore);

    constructor(
        address payable _feeRecipient,
        Network[] memory initialNetworks,
        address[] memory poolProviders,
        uint256[] memory liquidityScores
    ) FlashLoanReceiverBase(IPoolAddressesProvider(poolProviders[0])) { // Default to first provider
        require(initialNetworks.length == poolProviders.length && poolProviders.length == liquidityScores.length, "Array mismatch");
        owner = payable(msg.sender);
        feeRecipient = _feeRecipient;
        nonReentrantLock = 1;

        // Initialize network configurations
        for (uint256 i = 0; i < initialNetworks.length; i++) {
            networkConfigs[initialNetworks[i]] = NetworkConfig({
                poolProvider: poolProviders[i],
                liquidityScore: liquidityScores[i],
                active: true
            });
            activeNetworks.push(initialNetworks[i]);
            emit NetworkUpdated(initialNetworks[i], poolProviders[i], liquidityScores[i]);
        }
    }

    modifier nonReentrant() {
        require(nonReentrantLock == 1, "Reentrancy detected");
        nonReentrantLock = 2;
        _;
        nonReentrantLock = 1;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function getPairPrice(
        address _pairAddress,
        address _token
    ) internal view returns (uint256) {
        if (_pairAddress == address(0)) return 0;
        IUniswapV2Pair pair = IUniswapV2Pair(_pairAddress);
        (uint256 reserve0, uint256 reserve1,) = pair.getReserves();
        (uint256 wethReserve, uint256 tokenReserve) = WETH < _token ? (reserve0, reserve1) : (reserve1, reserve0);
        return tokenReserve == 0 ? 0 : (wethReserve * 1e18) / tokenReserve;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override nonReentrant whenNotPaused returns (bool) {
        require(initiator == address(this), "Invalid initiator");
        require(assets.length == 1 && approvedTokens[assets[0]], "Invalid asset");

        (uint256 maxSlippage, uint256 deadline, Network preferredNetwork) = abi.decode(params, (uint256, uint256, Network));
        require(maxSlippage <= 1000 && deadline >= block.timestamp, "Invalid params");

        Network selectedNetwork = selectBestNetwork(preferredNetwork);
        if (!networkConfigs[selectedNetwork].active) {
            emit TradeFailed(selectedNetwork, assets[0], "Network inactive");
            IERC20(assets[0]).approve(address(POOL), amounts[0] + premiums[0]);
            return true;
        }

        // Update POOL to use selected network's provider
        address poolProvider = networkConfigs[selectedNetwork].poolProvider;
        IPool pool = IPool(IPoolAddressesProvider(poolProvider).getPool());

        bool success = executeNetworkTrade(selectedNetwork, assets[0], amounts[0], maxSlippage, deadline, pool);
        uint256 totalRepayment = amounts[0] + premiums[0];
        IERC20(assets[0]).approve(address(pool), totalRepayment);
        return success;
    }

    function selectBestNetwork(Network preferred) internal view returns (Network) {
        if (networkConfigs[preferred].active && networkConfigs[preferred].liquidityScore > 50) {
            return preferred; // Use preferred if viable
        }

        // Fallback: Select network with highest liquidity score
        Network bestNetwork = activeNetworks[0];
        uint256 highestScore = networkConfigs[bestNetwork].liquidityScore;
        for (uint256 i = 1; i < activeNetworks.length; i++) {
            if (networkConfigs[activeNetworks[i]].active && networkConfigs[activeNetworks[i]].liquidityScore > highestScore) {
                bestNetwork = activeNetworks[i];
                highestScore = networkConfigs[activeNetworks[i]].liquidityScore;
            }
        }
        return bestNetwork;
    }

    function executeNetworkTrade(
        Network network,
        address token,
        uint256 amount,
        uint256 maxSlippage,
        uint256 deadline,
        IPool pool
    ) internal returns (bool) {
        address uniPair = IUniswapV2Factory(IUniswapV2Router02(UNISWAP_ROUTER).factory()).getPair(WETH, token);
        address sushiPair = IUniswapV2Factory(IUniswapV2Router02(SUSHISWAP_ROUTER).factory()).getPair(WETH, token);

        uint256 uniPrice = getPairPrice(uniPair, token);
        uint256 sushiPrice = getPairPrice(sushiPair, token);

        if (uniPrice == 0 || sushiPrice == 0) {
            emit TradeFailed(network, token, "Invalid prices");
            return true;
        }

        emit PriceData(network, token, uniPrice, sushiPrice, uniPrice > sushiPrice ? uniPrice - sushiPrice : sushiPrice - uniPrice);

        bool buyUniswap = sushiPrice > uniPrice;
        uint256 priceDiff = buyUniswap ? sushiPrice - uniPrice : uniPrice - sushiPrice;

        if (priceDiff > minProfitThreshold) {
            try this.executeTrade(network, token, amount, maxSlippage, buyUniswap, deadline) returns (uint256 profit) {
                if (profit > 0) {
                    uint256 fee = (profit * feePercentage) / 10000;
                    uint256 netProfit = profit - fee;
                    profits[token] += netProfit;
                    IERC20(token).transfer(feeRecipient, fee);
                    emit ArbitrageExecuted(network, token, netProfit, fee, buyUniswap ? "Buy Uni Sell Sushi" : "Buy Sushi Sell Uni", block.timestamp);
                }
            } catch Error(string memory reason) {
                emit TradeFailed(network, token, reason);
            }
        }
        return true;
    }

    function executeTrade(
        Network network,
        address token,
        uint256 amount,
        uint256 maxSlippage,
        bool buyUniswap,
        uint256 deadline
    ) external nonReentrant returns (uint256) {
        require(msg.sender == address(this), "Internal call only");

        address[] memory path = new address[](2);
        (path[0], path[1]) = buyUniswap ? (token, WETH) : (WETH, token);

        IUniswapV2Router02 buyRouter = IUniswapV2Router02(buyUniswap ? UNISWAP_ROUTER : SUSHISWAP_ROUTER);
        IUniswapV2Router02 sellRouter = IUniswapV2Router02(buyUniswap ? SUSHISWAP_ROUTER : UNISWAP_ROUTER);

        uint256[] memory amountsOut = buyRouter.getAmountsOut(amount, path);
        uint256 amountOutMin = amountsOut[1] * (10000 - maxSlippage) / 10000;
        IERC20(token).approve(address(buyRouter), amount);
        uint256[] memory buyResult = buyRouter.swapExactTokensForTokens(amount, amountOutMin, path, address(this), deadline);

        (path[0], path[1]) = (path[1], path[0]);
        amountsOut = sellRouter.getAmountsOut(buyResult[1], path);
        amountOutMin = amountsOut[1] * (10000 - maxSlippage) / 10000;
        IERC20(WETH).approve(address(sellRouter), buyResult[1]);
        uint256[] memory sellResult = sellRouter.swapExactTokensForTokens(buyResult[1], amountOutMin, path, address(this), deadline);

        uint256 profit = sellResult[1] > amount ? sellResult[1] - amount : 0;
        require(profit > minProfitThreshold, "Profit below threshold");
        return profit;
    }

    // Admin functions
    function updateNetwork(Network network, address poolProvider, uint256 liquidityScore, bool active) external onlyOwner {
        networkConfigs[network] = NetworkConfig(poolProvider, liquidityScore, active);
        if (active && !containsNetwork(network)) activeNetworks.push(network);
        else if (!active) removeNetwork(network);
        emit NetworkUpdated(network, poolProvider, liquidityScore);
    }

    function setPaused(bool _paused) external onlyOwner { paused = _paused; emit Paused(_paused); }
    function setFeePercentage(uint256 _fee) external onlyOwner { require(_fee <= 1000); feePercentage = _fee; emit FeeUpdated(_fee); }
    function setMinProfitThreshold(uint256 _threshold) external onlyOwner { minProfitThreshold = _threshold; }
    function approveToken(address token, bool status) external onlyOwner { approvedTokens[token] = status; emit TokenApproval(token, status); }
    function withdraw(address token) external onlyOwner {
        if (token == address(0)) { uint256 balance = address(this).balance; require(balance > 0); owner.transfer(balance); }
        else { uint256 balance = IERC20(token).balanceOf(address(this)); require(balance > 0); IERC20(token).transfer(owner, balance); }
    }

    // Helper functions
    function containsNetwork(Network network) internal view returns (bool) {
        for (uint256 i = 0; i < activeNetworks.length; i++) if (activeNetworks[i] == network) return true;
        return false;
    }

    function removeNetwork(Network network) internal {
        for (uint256 i = 0; i < activeNetworks.length; i++) {
            if (activeNetworks[i] == network) {
                activeNetworks[i] = activeNetworks[activeNetworks.length - 1];
                activeNetworks.pop();
                break;
            }
        }
    }

    // Public view functions
    function getProfit(address token) external view returns (uint256) { return profits[token]; }
    function isTokenApproved(address token) external view returns (bool) { return approvedTokens[token]; }

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    receive() external payable {}
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
