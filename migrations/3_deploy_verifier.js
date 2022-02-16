const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Rollup1Verifier = artifacts.require('Rollup1Verifier');
const Rollup4Verifier = artifacts.require('Rollup4Verifier');
const Rollup16Verifier = artifacts.require('Rollup16Verifier');
//const Rollup64Verifier = artifacts.require('Rollup64Verifier');
//const Rollup256Verifier = artifacts.require('Rollup256Verifier');

module.exports = async function (deployer) {
  const promise1 = deployer.deploy(WithdrawVerifier);
  const promise2 = deployer.deploy(Rollup1Verifier);
  const promise3 = deployer.deploy(Rollup4Verifier);
  const promise4 = deployer.deploy(Rollup16Verifier);
  //const promise5 = deployer.deploy(Rollup64Verifier);
  //const promise6 = deployer.deploy(Rollup256Verifier);
  await Promise.all([promise1, promise2, promise3, promise4]);
};
