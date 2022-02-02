require('dotenv').config({ path: '../.env' });

const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const Hasher3 = artifacts.require('Hasher3');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();
    const hasher3 = await Hasher3.deployed();
    await deployer.deploy(
      MystikoWithLoopMain,
      verifier.address,
      hasher2.address,
      hasher3.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
