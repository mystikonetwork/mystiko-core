require('dotenv').config({ path: '../.env' });

const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const Hasher3 = artifacts.require('Hasher3');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer, network) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROPSTEN_ERC20_ADDRESS, BSC_TESTNET_ERC20_ADDRESS } = process.env;

    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();
    const hasher3 = await Hasher3.deployed();
    const testToken = await TestToken.deployed();

    var tokneAddress;
    if (network === 'bsctestnet') {
      tokneAddress = BSC_TESTNET_ERC20_ADDRESS;
    } else if (network === 'ropsten') {
      tokneAddress = ROPSTEN_ERC20_ADDRESS;
    } else {
      tokneAddress = testToken.address;
    }

    await deployer.deploy(
      MystikoWithLoopERC20,
      verifier.address,
      tokneAddress,
      hasher2.address,
      hasher3.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
