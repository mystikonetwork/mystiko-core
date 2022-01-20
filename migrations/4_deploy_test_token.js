const TestToken = artifacts.require('TestToken');

module.exports = function (deployer, network) {
  deployer.deploy(TestToken);
};
