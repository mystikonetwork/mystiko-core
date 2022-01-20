const Verifier = artifacts.require('Verifier');

module.exports = function(deployer, network) {
  deployer.deploy(Verifier);
};
