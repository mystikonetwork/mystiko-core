require('dotenv').config({ path: '../.env' });

const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Hasher = artifacts.require('Hasher2');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await WithdrawVerifier.deployed();
    const hasher = await Hasher.deployed();
    await deployer.deploy(MystikoWithLoopMain, verifier.address, hasher.address, MERKLE_TREE_HEIGHT);
  });
};
