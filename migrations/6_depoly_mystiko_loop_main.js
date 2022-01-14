require('dotenv').config({ path: '../.env' });
const MystikoWithLoop = artifacts.require('MystikoWithLoopMain');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');

module.exports = function (deployer) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const verifier = await Verifier.deployed();
    const hasher = await Hasher.deployed();
    const mystiko = await deployer.deploy(
      MystikoWithLoop,
      verifier.address,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );
    console.log('MystikoWithLoopMain address', mystiko.address);
  });
};
