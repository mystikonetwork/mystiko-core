require('dotenv').config({ path: '../.env' });

const MystikoV2WithLoopMain = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROOT_HISTORY_LENGTH, MIN_ROLLUP_FEE } = process.env;
    const verifier = await WithdrawVerifier.deployed();
    await deployer.deploy(
      MystikoV2WithLoopMain,
      MERKLE_TREE_HEIGHT,
      ROOT_HISTORY_LENGTH,
      MIN_ROLLUP_FEE,
      verifier.address,
    );
  });
};
