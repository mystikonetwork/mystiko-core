require('dotenv').config({ path: '../.env' });
const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await Verifier.deployed();
    const hasher = await Hasher.deployed();
    const token = await TestToken.deployed();
    await deployer.deploy(
      MystikoWithLoopERC20,
      verifier.address,
      token.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
