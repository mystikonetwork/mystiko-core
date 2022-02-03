const Hasher2 = artifacts.require('Hasher2');

module.exports = async function (deployer) {
  await deployer.deploy(Hasher2);
};
