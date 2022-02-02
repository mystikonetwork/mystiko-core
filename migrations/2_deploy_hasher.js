const Hasher2 = artifacts.require('Hasher2');
const Hasher3 = artifacts.require('Hasher3');

module.exports = async function (deployer) {
  const promise1 = deployer.deploy(Hasher2);
  const promise2 = deployer.deploy(Hasher3);
  await Promise.all([promise1, promise2]);
};
