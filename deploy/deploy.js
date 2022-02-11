const MystikoWithCelerERC20 = artifacts.require('MystikoWithCelerERC20');
const MystikoWithCelerMain = artifacts.require('MystikoWithCelerMain');
const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');

const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const common = require('./common');

function getMystikoContract(bridge, bErc20) {
  if (bridge == 'celer') {
    if (bErc20) {
      return MystikoWithCelerERC20;
    } else {
      return MystikoWithCelerMain;
    }
  } else if (bridge == 'poly') {
    if (bErc20) {
      return MystikoWithPolyERC20;
    } else {
      return MystikoWithPolyMain;
    }
  } else {
    console.log('bridge not support');
    return null;
  }
}

async function deployMystiko(bridgeName, src, dst, config, proxyAddress) {
  const { MERKLE_TREE_HEIGHT } = process.env;

  const provider = common.getProvider(src.network);
  if (provider == null) {
    return null;
  }

  console.log('src.network ', src.network);

  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain == null) {
    return null;
  }

  const dstChain = common.getChainConfig(config, dst.network);
  if (srcChain == null) {
    return null;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token == null) {
    return null;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore == null) {
    return null;
  }

  return await MystikoCore.new(
    proxyAddress,
    dstChain.chainId,
    srcChain.verifierAddress,
    token.address,
    srcChain.hashAddress,
    MERKLE_TREE_HEIGHT,
  );
}

async function setMystikoPeerAddress(bridgeName, src, dst, config) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain == null) {
    return null;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token == null) {
    return null;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore == null) {
    return null;
  }

  let mystikoCore = await MystikoCore.at(src.address);
  await mystikoCore.setPeerContractAddress(dst.address);
}

//depoly hasher and verifier
async function deployStep1() {
  if (process.argv.length != 8) {
    console.log('should special parameter ');
    console.log('   network           : testnet 、 mainnet) ');
    console.log('   step              : step1  ');
    return;
  }

  const network = process.argv[5];
  const cfgNetwork = process.argv[6];

  const config = await common.loadConfig(cfgNetwork);
  if (config == null) {
    return;
  }

  const hasher = await Hasher.deployed();
  console.log('hasher address: ', hasher.address);

  const verifier = await Verifier.deployed();
  console.log('verifier address: ', verifier.address);

  common.saveBaseAddressConfig(cfgNetwork, network, config, hasher.address, verifier.address);
}

//deploy mystiko contract
async function deployStep2or3() {
  if (process.argv.length != 10) {
    console.log('should special parameter ');
    console.log('   network           : testnet 、 mainnet) ');
    console.log('   step              : step2  ');
    console.log('   bridge name       : tbridge 、 celer、 poly ');
    console.log('   token pair index  :  0,1,3...  ');
    return;
  }

  const network = process.argv[5];
  const cfgNetwork = process.argv[6];
  const step = process.argv[7];
  const bridgeName = process.argv[8];
  const pairIndex = process.argv[9];

  const config = await common.loadConfig(cfgNetwork);
  if (config == null) {
    return;
  }

  const bridge = common.getBridgeConfig(config, bridgeName);
  if (bridge == null) {
    return;
  }

  const pair = common.getBridgePairByIndex(bridge, pairIndex);
  if (pair == null) {
    return;
  }

  let i, j;
  if (pair[0].network == network) {
    i = 0;
    j = 1;
  } else if (pair[1].network == network) {
    i = 1;
    j = 0;
  } else {
    console.log('network wrong ');
    return;
  }

  src = pair[i];
  dst = pair[j];
  proxyAddress = common.getBridgeProxyAddress(bridge, pair[i].network);

  if (step == 'step2') {
    const m = await deployMystiko(bridgeName, src, dst, config, proxyAddress);
    console.log(m.address);
    common.saveMystikoAddressConfig(cfgNetwork, config, bridgeName, pairIndex, i, m.address);
  } else if (step == 'step3') {
    if (src.address == '') {
      console.log('src mystiko address is null');
      return;
    }

    if (dst.address == '') {
      console.log('dst mystiko address is null');
      return;
    }

    await setMystikoPeerAddress(bridgeName, src, dst, config);
  } else {
    console.log('not support step');
  }
}

module.exports = async function (callback) {
  const step = process.argv[7];
  if (step == 'step1') {
    await deployStep1();
  } else if (step == 'step2') {
    await deployStep2or3();
  } else if (step == 'step3') {
    await deployStep2or3();
  }

  // invoke callback
  callback();
};
