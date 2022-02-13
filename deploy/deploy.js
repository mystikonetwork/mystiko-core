const MystikoWithLoopERC20 = artifacts.require('MystikoWithLoopERC20');
const MystikoWithLoopMain = artifacts.require('MystikoWithLoopMain');
const MystikoWithTBridgeERC20 = artifacts.require('MystikoWithTBridgeERC20');
const MystikoWithTBridgeMain = artifacts.require('MystikoWithTBridgeMain');
const MystikoWithPolyERC20 = artifacts.require('MystikoWithPolyERC20');
const MystikoWithPolyMain = artifacts.require('MystikoWithPolyMain');
const MystikoWithCelerERC20 = artifacts.require('MystikoWithCelerERC20');
const MystikoWithCelerMain = artifacts.require('MystikoWithCelerMain');

const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');
const common = require('./common');
const coreConfig = require('./coreConfig');

function getMystikoContract(bridge, bErc20) {
  if (bridge == 'loop') {
    if (bErc20 == 'true') {
      return MystikoWithLoopERC20;
    } else {
      return MystikoWithLoopMain;
    }
  } else if (bridge == 'tbridge') {
    if (bErc20 == 'true') {
      return MystikoWithTBridgeERC20;
    } else {
      return MystikoWithTBridgeMain;
    }
  } else if (bridge == 'celer') {
    if (bErc20 == 'true') {
      return MystikoWithCelerERC20;
    } else {
      return MystikoWithCelerMain;
    }
  } else if (bridge == 'poly') {
    if (bErc20 == 'true') {
      return MystikoWithPolyERC20;
    } else {
      return MystikoWithPolyMain;
    }
  } else {
    console.error(common.RED, 'bridge not support');
    return null;
  }
}

async function deployMystiko(bridgeName, src, dst, config, proxyAddress) {
  const { MERKLE_TREE_HEIGHT } = process.env;

  common.info('src.network ', src.network);

  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain == null) {
    return null;
  }

  if (srcChain.verifierAddress == '' || srcChain.hashAddress == '') {
    console.log('should do step1');
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

  if (bridgeName == 'loop') {
    if (token.erc20 == 'true') {
      return await MystikoCore.new(
        srcChain.verifierAddress,
        token.address,
        srcChain.hashAddress,
        MERKLE_TREE_HEIGHT,
      );
    } else {
      return await MystikoCore.new(srcChain.verifierAddress, srcChain.hashAddress, MERKLE_TREE_HEIGHT);
    }
  } else {
    if (token.erc20 == 'true') {
      return await MystikoCore.new(
        proxyAddress,
        dstChain.chainId,
        srcChain.verifierAddress,
        token.address,
        srcChain.hashAddress,
        MERKLE_TREE_HEIGHT,
      );
    } else {
      return await MystikoCore.new(
        proxyAddress,
        dstChain.chainId,
        srcChain.verifierAddress,
        srcChain.hashAddress,
        MERKLE_TREE_HEIGHT,
      );
    }
  }
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
  return await mystikoCore.setPeerContractAddress(dst.address);
}

//deploy hasher and verifier
async function deployStep1() {
  if (process.argv.length != 8) {
    console.log('should special parameter ');
    console.log('   network           : testnet 、 mainnet) ');
    console.log('   step              : step1  ');
    return;
  }

  const network = process.argv[5];
  const cfgNetwork = process.argv[6];

  const config = common.loadConfig(cfgNetwork);
  if (config == null) {
    return;
  }

  const hasher = await Hasher.new();
  console.log('hasher address: ', hasher.address);

  const verifier = await Verifier.new();
  console.log('verifier address: ', verifier.address);

  common.saveBaseAddressConfig(cfgNetwork, network, config, hasher.address, verifier.address);
}

//deploy mystiko contract and configure peer contract address
async function deployStep2or3() {
  if (process.argv.length != 11) {
    console.log('should special parameter ');
    console.log('   mystiko network     : testnet、mainnet) ');
    console.log('   step                : step2  ');
    console.log('   bridge name         : tbridge、celer、poly ');
    console.log('   destination network : ropsten、bsctestnet ...  ');
    console.log('   token name          : ETH、MTT、mUSD、BNB...  ');
    return;
  }

  const srcNetwork = process.argv[5];
  const mystikoNetwork = process.argv[6];
  const step = process.argv[7];
  const bridgeName = process.argv[8];
  const dstNetwork = process.argv[9];
  const tokenName = process.argv[10];

  const config = common.loadConfig(mystikoNetwork);
  if (config == null) {
    return;
  }

  const bridge = common.getBridgeConfig(config, bridgeName);
  if (bridge == null) {
    return;
  }

  const pairIndex = common.getBridgePairIndexByTokenName(bridge, srcNetwork, dstNetwork, tokenName);
  if (pairIndex == -1) {
    return;
  }

  const pair = common.getBridgePairByIndex(bridge, pairIndex);

  let i, j;
  if (bridgeName == 'loop') {
    i = 0;
    j = 0;
  } else {
    if (pair[0].network == srcNetwork) {
      i = 0;
      j = 1;
    } else if (pair[1].network == srcNetwork) {
      i = 1;
      j = 0;
    } else {
      console.error(common.RED, 'network wrong ');
      return;
    }
  }

  const src = pair[i];
  const dst = pair[j];
  const proxyAddress = common.getBridgeProxyAddress(bridge, pair[i].network);

  if (step == 'step2') {
    const m = await deployMystiko(bridgeName, src, dst, config, proxyAddress);
    console.log(m.address);
    common.saveMystikoAddressConfig(mystikoNetwork, config, bridgeName, pairIndex, i, m.address);
  } else if (step == 'step3') {
    if (src.address == '') {
      console.error(common.RED, 'src mystiko address is null');
      return;
    }

    if (dst.address == '') {
      console.error(common.RED, 'dst mystiko address is null');
      return;
    }

    await setMystikoPeerAddress(bridgeName, src, dst, config);
    coreConfig.savePeerConfig(mystikoNetwork, bridgeName, src, dst, config);
  } else {
    console.error(common.RED, 'not support step');
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
