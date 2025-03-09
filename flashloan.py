import json
from web3 import Web3
from eth_account import Account
import time

# Sepolia testnet
INFURA_URL = "https://sepolia.infura.io/v3/4b9e1ec153a14901b9adc5174c838658"  # Replace with your Infura key
w3 = Web3(Web3.HTTPProvider(INFURA_URL))

# Goerli contract addresses (Uniswap V2 and tokens are real, dYdX and Curve are mocked)
DYDX_ADDRESS = "0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e"  # Mainnet, mocked for Goerli
UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"  # Mainnet, mocked for Goerli (real Goerli: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f)
CURVE_POOL = "0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56"    # Mainnet, mocked for Goerli
WETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"        # Goerli WETH
DAI = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"         # Goerli DAI

# ABIs from JSON (simplified)
DYDX_ABI = json.loads('[{"name":"operate","inputs":[{"type":"address[]","name":"accounts"},{"type":"tuple[]","name":"actions","components":[{"type":"uint8","name":"actionType"},{"type":"uint256","name":"accountId"},{"type":"uint256","name":"amount"},{"type":"uint256","name":"primaryMarketId"},{"type":"uint256","name":"secondaryMarketId"},{"type":"address","name":"otherAddress"},{"type":"uint256","name":"otherAccountId"},{"type":"bytes","name":"data"}]}],"outputs":[],"stateMutability":"nonpayable","type":"function"}]')
UNISWAP_ABI = json.loads('[{"name":"swapExactTokensForTokens","inputs":[{"type":"uint256","name":"amountIn"},{"type":"uint256","name":"amountOutMin"},{"type":"address[]","name":"path"},{"type":"address","name":"to"},{"type":"uint256","name":"deadline"}],"outputs":[{"type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"}]')
CURVE_ABI = json.loads('[{"name":"exchange","inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"outputs":[{"type":"uint256"}],"stateMutability":"nonpayable","type":"function"}]')
ERC20_ABI = json.loads('[{"name":"approve","inputs":[{"type":"address","name":"spender"},{"type":"uint256","name":"amount"}],"outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"name":"transfer","inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"amount"}],"outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"}]')

# Contracts
dydx = w3.eth.contract(address=DYDX_ADDRESS, abi=DYDX_ABI)
uniswap = w3.eth.contract(address=UNISWAP_ROUTER, abi=UNISWAP_ABI)
curve = w3.eth.contract(address=CURVE_POOL, abi=CURVE_ABI)
weth = w3.eth.contract(address=WETH, abi=ERC20_ABI)
dai = w3.eth.contract(address=DAI, abi=ERC20_ABI)

class FlashLoan:
    def __init__(self, private_key):
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.private_key = private_key

    def deploy_contract(self, contract_path):
        with open(contract_path, 'r') as f:
            contract_source = f.read()
        # Placeholder for deployment, to be replaced after Hardhat setup
        return "DEPLOYED_CONTRACT_ADDRESS"

    def check_arbitrage_opportunity(self, amount_in=100 * 10**18):  # 100 WETH
        path = [WETH, DAI]
        try:
            uniswap_out = uniswap.functions.swapExactTokensForTokens(amount_in, 0, path, self.address, int(time.time()) + 60).call()[-1]
            curve_out = curve.functions.exchange(0, 1, uniswap_out, 0).call()
            fee = amount_in * 2 // 10000  # 0.02% dYdX fee
            profit = curve_out - amount_in - fee
            if profit > 0.5 * 10**18:  # At least 0.5 WETH profit
                return profit, uniswap_out
            return 0, 0
        except Exception as e:
            print(f"Price check failed (likely mock contract issue): {e}")
            return 0, 0

    def execute_flash_loan(self, proxy_address, slippage_tolerance=50): # 0.5% default
        amount_in = 100 * 10**18
        profit, dai_amount = self.check_arbitrage_opportunity(amount_in)
        if profit <= 0:
            print("No profitable opportunity or mock contracts failed")
            return

        accounts = [proxy_address]
        actions = [(
            2,  # Flash loan action
            0,
            amount_in,
            0,  # WETH marketId
            0,
            proxy_address,
            0,
            w3.eth.abi.encode(
                ['uint256', 'uint256', 'address[]', 'bytes[]'],
                [
                    amount_in,
                    slippage_tolerance,
                    [UNISWAP_ROUTER, CURVE_POOL, WETH, WETH],
                    [
                        uniswap.encodeABI('swapExactTokensForTokens', [amount_in, 0, [WETH, DAI], proxy_address, int(time.time()) + 60]),
                        curve.encodeABI('exchange', [0, 1, dai_amount, 0]),
                        weth.encodeABI('transfer', [DYDX_ADDRESS, amount_in + (amount_in * 2 // 10000)]),
                        weth.encodeABI('transfer', [self.address, profit])
                    ]
                ]
            )
        )]

        tx = dydx.functions.operate(accounts, actions).build_transaction({
            'from': self.address,
            'nonce': w3.eth.get_transaction_count(self.address),
            'gas': 1500000,
            'gasPrice': w3.to_wei('5', 'gwei')
        })
        signed_tx = w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        print(f"Transaction sent: {tx_hash.hex()}")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Transaction confirmed: {receipt.status}")
        balance = weth.functions.balanceOf(self.address).call()
        print(f"Profit in WETH: {balance / 10**18}")

if __name__ == "__main__":
    PRIVATE_KEY = "5308b9572838bb9980507e15cb15034dfcdbcd7285e375d7e1c862d9e80ddf5e"
    fl = FlashLoan(PRIVATE_KEY)
    PROXY_ADDRESS = fl.deploy_contract("contracts/FlashLoanArbitrage.sol")
    fl.execute_flash_loan(PROXY_ADDRESS)
