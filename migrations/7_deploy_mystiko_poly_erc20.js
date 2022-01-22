require('dotenv').config({ path: '../.env' });
const PUBLIC_CHAIN = ['ropsten', 'bsctestnet', 'bsc', 'ethereum'];

const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer, network) {
  if (!PUBLIC_CHAIN.includes(network)) {
    return;
  }

  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;

    var crosschainManagerProxyAddress;
    var destinationChainId;
    if (network === 'bsctestnet') {
      const { POLY_ECCMP_BSC_TESTNET, ROPSTEN_CHAINID } = process.env;
      crosschainManagerProxyAddress = POLY_ECCMP_BSC_TESTNET;
      destinationChainId = ROPSTEN_CHAINID;
    } else if (network === 'ropsten') {
      const { POLY_ECCMP_ROPSTEN, BSC_TESTNET_CHAINID } = process.env;
      crosschainManagerProxyAddress = POLY_ECCMP_ROPSTEN;
      destinationChainId = BSC_TESTNET_CHAINID;
    } else {
      return;
    }

    const verifier = await Verifier.deployed();
    const hasher = await Hasher.deployed();
    const token = await TestToken.deployed();

    await deployer.deploy(
      MystikoWithPolyERC20,
      crosschainManagerProxyAddress,
      destinationChainId,
      verifier.address,
      token.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
