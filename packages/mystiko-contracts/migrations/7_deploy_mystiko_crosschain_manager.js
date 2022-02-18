const CrosschainManager = artifacts.require('MystikoCrossChainManager');
const PUBLIC_CHAIN = ['ropsten', 'bsctestnet', 'bsc', 'ethereum'];

module.exports = function (deployer, network) {
  if (!PUBLIC_CHAIN.includes(network)) {
    return;
  }

  deployer.deploy(CrosschainManager);
};
