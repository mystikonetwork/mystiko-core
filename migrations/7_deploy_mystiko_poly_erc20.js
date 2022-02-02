require('dotenv').config({ path: '../.env' });
const PUBLIC_CHAIN = ['ropsten', 'bsctestnet', 'bsc', 'ethereum'];

const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const Hasher3 = artifacts.require('Hasher3');

module.exports = function (deployer, network) {
  if (!PUBLIC_CHAIN.includes(network)) {
    return;
  }

  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROPSTEN_ERC20_ADDRESS, BSC_TESTNET_ERC20_ADDRESS } = process.env;

    var crosschainManagerProxyAddress;
    var destinationChainId;
    var tokneAddress;
    if (network === 'bsctestnet') {
      const { POLY_ECCMP_BSC_TESTNET, ROPSTEN_CHAINID } = process.env;
      crosschainManagerProxyAddress = POLY_ECCMP_BSC_TESTNET;
      destinationChainId = ROPSTEN_CHAINID;
      tokneAddress = BSC_TESTNET_ERC20_ADDRESS;
    } else if (network === 'ropsten') {
      const { POLY_ECCMP_ROPSTEN, BSC_TESTNET_CHAINID } = process.env;
      crosschainManagerProxyAddress = POLY_ECCMP_ROPSTEN;
      destinationChainId = BSC_TESTNET_CHAINID;
      tokneAddress = ROPSTEN_ERC20_ADDRESS;
    } else {
      return;
    }

    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();
    const hasher3 = await Hasher3.deployed();

    await deployer.deploy(
      MystikoWithPolyERC20,
      crosschainManagerProxyAddress,
      destinationChainId,
      verifier.address,
      tokneAddress,
      hasher2.address,
      hasher3.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
