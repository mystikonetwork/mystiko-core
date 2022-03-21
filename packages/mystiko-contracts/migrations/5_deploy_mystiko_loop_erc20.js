require('dotenv').config({ path: '../.env' });

const MystikoV2WithLoopERC20 = artifacts.require('MystikoV2WithLoopERC20');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROOT_HISTORY_LENGTH, MIN_ROLLUP_FEE } = process.env;

    const verifier = await WithdrawVerifier.deployed();
    const testToken = await TestToken.deployed();
    const tokenAddress = testToken.address;

    await deployer.deploy(
      MystikoV2WithLoopERC20,
      MERKLE_TREE_HEIGHT,
      ROOT_HISTORY_LENGTH,
      MIN_ROLLUP_FEE,
      verifier.address,
      tokenAddress,
    );
  });
};
