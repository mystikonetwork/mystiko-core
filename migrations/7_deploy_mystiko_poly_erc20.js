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

    var crosschainManagerAddress;
    var destinationChainId;
    if (network == 'bsctestnet') {
      const { POLY_ECCM_BSC_TESTNET, ROPSTEN_CHAINID } = process.env;
      crosschainManagerAddress = POLY_ECCM_BSC_TESTNET;
      destinationChainId = ROPSTEN_CHAINID;
    } else if (network == 'ropsten') {
      const { POLY_ECCM_ROPSTEN, BSC_TESTNET_CHAINID } = process.env;
      crosschainManagerAddress = POLY_ECCM_ROPSTEN;
      destinationChainId = BSC_TESTNET_CHAINID;
    } else {
      return;
    }

    const verifier = await Verifier.deployed();
    const hasher = await Hasher.deployed();
    const token = await TestToken.deployed();

    await deployer.deploy(
      MystikoWithPolyERC20,
      crosschainManagerAddress,
      destinationChainId,
      verifier.address,
      token.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
