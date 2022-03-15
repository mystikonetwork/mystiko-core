require('dotenv').config({ path: '../.env' });

const MystikoV2WithLoopMain = artifacts.require('MystikoV2WithLoopMain');
const WithdrawVerifier = artifacts.require('WithdrawVerifier');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await WithdrawVerifier.deployed();
    await deployer.deploy(
      MystikoV2WithLoopMain,
      MERKLE_TREE_HEIGHT,
      30,
      '1000000000000000',
      verifier.address,
    );
  });
};
