require('dotenv').config({ path: '../.env' });

const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const MystikoV2WithLoopMain = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await WithdrawVerifier.deployed();
    const hasher2 = await Hasher2.deployed();
    await deployer.deploy(MystikoWithLoopMain, verifier.address, hasher2.address, MERKLE_TREE_HEIGHT);
    await deployer.deploy(
      MystikoV2WithLoopMain,
      MERKLE_TREE_HEIGHT,
      30,
      '1000000000000000',
      verifier.address,
    );
  });
};
