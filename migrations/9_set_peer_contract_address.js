require('dotenv').config({ path: '../.env' });
const PUBLIC_CHAIN = ['ropsten', 'bsctestnet', 'bsc', 'ethereum'];

const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');
const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');

module.exports = function (deployer, network) {
  if (!PUBLIC_CHAIN.includes(network)) {
    return;
  }

  return deployer.then(async () => {
    var peerContractAddressMain;
    var peerContractAddressERC20;

    if (network == 'bsctestnet') {
      const { ROPSTEN_MYSTIKO_MAIN_ADDRESS, ROPSTEN_MYSTIKO_ERC20_ADDRESS } = process.env;
      peerContractAddressMain = ROPSTEN_MYSTIKO_MAIN_ADDRESS;
      peerContractAddressERC20 = ROPSTEN_MYSTIKO_ERC20_ADDRESS;
    } else if (network == 'ropsten') {
      const { BSC_TESTNET_MYSTIKO_MAIN_ADDRESS, BSC_TESTNET_MYSTIKO_ERC20_ADDRESS } = process.env;
      peerContractAddressMain = BSC_TESTNET_MYSTIKO_MAIN_ADDRESS;
      peerContractAddressERC20 = BSC_TESTNET_MYSTIKO_ERC20_ADDRESS;
    } else {
      return;
    }

    const main = await MystikoWithPolyMain.deployed();
    await main.setPeerContractAddress(peerContractAddressMain);

    const erc20 = await MystikoWithPolyERC20.deployed();
    await erc20.setPeerContractAddress(peerContractAddressERC20);
  });
};
