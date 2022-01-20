const Hasher = artifacts.require('Hasher');

module.exports = async function(deployer, network) {
  await deployer.deploy(Hasher);
};
