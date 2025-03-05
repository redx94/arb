// migrations/4_deploy_mock_pool_provider.js
const MockPoolAddressesProvider = artifacts.require("MockPoolAddressesProvider");

module.exports = function (deployer) {
  // Deploy MockPoolAddressesProvider with a dummy pool address
  deployer.deploy(MockPoolAddressesProvider, "0x0000000000000000000000000000000000000000"); 
};
