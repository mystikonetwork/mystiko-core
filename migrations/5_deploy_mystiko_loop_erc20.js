require('dotenv').config({ path: '../.env' });

const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const TestToken = artifacts.require('TestToken');

module.exports = function (deployer, network) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT, ROPSTEN_ERC20_ADDRESS, BSC_TESTNET_ERC20_ADDRESS } = process.env;

    const verifier = await Verifier.deployed();
    const hasher = await Hasher.deployed();
    const testToken = await TestToken.deployed();

    var tokneAddress;
    if (network === 'bsctestnet') {
      tokneAddress = BSC_TESTNET_ERC20_ADDRESS;
    } else if (network === 'ropsten') {
      tokneAddress = ROPSTEN_ERC20_ADDRESS;
    } else {
      tokneAddress = testToken.address;
    }

    await deployer.deploy(
      MystikoWithLoopERC20,
      verifier.address,
      tokneAddress,
      hasher.address,
      MERKLE_TREE_HEIGHT,
    );
  });
};
