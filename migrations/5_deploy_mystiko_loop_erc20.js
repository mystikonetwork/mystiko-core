require('dotenv').config({ path: '../.env' });

const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const MystikoV2WithLoopERC20 = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer, network) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROPSTEN_ERC20_ADDRESS, BSC_TESTNET_ERC20_ADDRESS } = process.env;

    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();
    const testToken = await TestToken.deployed();

    var tokenAddress;
    if (network === 'bsctestnet') {
      tokenAddress = BSC_TESTNET_ERC20_ADDRESS;
    } else if (network === 'ropsten') {
      tokenAddress = ROPSTEN_ERC20_ADDRESS;
    } else {
      tokenAddress = testToken.address;
    }

    await deployer.deploy(
      MystikoWithLoopERC20,
      verifier.address,
      tokenAddress,
      hasher2.address,
      MERKLE_TREE_HEIGHT,
    );
    await deployer.deploy(
      MystikoV2WithLoopERC20,
      MERKLE_TREE_HEIGHT,
      30,
      '1000000000000000000',
      verifier.address,
      tokenAddress,
    );
  });
};
