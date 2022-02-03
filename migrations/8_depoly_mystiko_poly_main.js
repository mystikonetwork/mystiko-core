require('dotenv').config({ path: '../.env' });
const PUBLIC_CHAIN = ['ropsten', 'bsctestnet', 'bsc', 'ethereum'];

const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');

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

    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();

    await deployer.deploy(
      MystikoWithPolyMain,
      crosschainManagerProxyAddress,
      destinationChainId,
      verifier.address,
      hasher2.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
