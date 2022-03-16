const MystikoWithLoopERC20 = artifacts.require('MystikoV2WithLoopERC20');
const MystikoWithLoopMain = artifacts.require('MystikoV2WithLoopMain');
const MystikoWithTBridgeERC20 = artifacts.require('MystikoWithTBridgeERC20');
const MystikoWithTBridgeMain = artifacts.require('MystikoWithTBridgeMain');
const MystikoWithCelerERC20 = artifacts.require('MystikoWithCelerERC20');
const MystikoWithCelerMain = artifacts.require('MystikoWithCelerMain');
const MystikoTBridgeProxy = artifacts.require('MystikoTBridgeProxy');
const TestToken = artifacts.require('TestToken');

const WithdrawVerifier = artifacts.require('WithdrawVerifier');
const Rollup1Verifier = artifacts.require('Rollup1Verifier');

const common = require('./common');
const coreConfig = require('./coreConfig');
const tbridgeConfig = require('./tbridgeConfig');
const mainNetwork = ['bsc', 'ethereum', 'moonbeam'];

function getMystikoContract(bridge, bErc20) {
  if (bridge === 'loop') {
    if (bErc20 === 'true') {
      return MystikoWithLoopERC20;
    } else {
      return MystikoWithLoopMain;
    }
  } else if (bridge === 'tbridge') {
    if (bErc20 === 'true') {
      return MystikoWithTBridgeERC20;
    } else {
      return MystikoWithTBridgeMain;
    }
  } else if (bridge === 'celer') {
    if (bErc20 === 'true') {
      return MystikoWithCelerERC20;
    } else {
      return MystikoWithCelerMain;
    }
  } else {
    console.error(common.RED, 'bridge not support');
    return null;
  }
}

function getMystikoNetwork(network) {
  if (network == 'development') {
    console.log('development network');
    return 'development';
  } else {
    for (const n of mainNetwork) {
      if (n === network) {
        console.log('main network');
        return 'mainnet';
      }
    }

    console.log('testnet network');
    return 'testnet';
  }
}

async function deployTBridgeProxy() {
  console.log('deploy contract CrossChainProxy');
  console.log('deploy MystikoTBridgeProxy');
  const proxy = await MystikoTBridgeProxy.new()
    .then((proxy) => {
      return proxy;
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });

  if (process.env.TBRIDGE_PROXY_OPERATOR) {
    console.log('change  CrossChainProxy operator');
    await proxy
      .changeOperator(process.env.TBRIDGE_PROXY_OPERATOR)
      .then(() => {})
      .catch((err) => {
        console.error(common.RED, err);
        process.exit(1);
      });
  }

  return proxy.address;
}

async function deployMystiko(bridgeName, src, dst, config, proxyAddress) {
  const { MERKLE_TREE_HEIGHT, ROOT_HISTORY_LENGTH, MIN_ROLLUP_FEE } = process.env;
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === null) {
    return '';
  }

  if (srcChain.verifierAddress === '' || srcChain.hashAddress === '') {
    console.log('should do step1');
    return '';
  }

  const dstChain = common.getChainConfig(config, dst.network);
  if (srcChain === null) {
    return '';
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === null) {
    return '';
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === null) {
    return '';
  }

  console.log('deploy MystikoCore');
  let address = '';
  let trxHash = '';
  if (bridgeName === 'loop') {
    if (token.erc20 === 'true') {
      await MystikoCore.new(
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_ROLLUP_FEE,
        srcChain.verifierAddress,
        token.address,
      )
        .then((response) => {
          address = response.address;
          trxHash = response.transactionHash;
        })
        .catch((err) => {
          console.error(common.RED, err);
          process.exit(1);
        });
    } else {
      await MystikoCore.new(MERKLE_TREE_HEIGHT, ROOT_HISTORY_LENGTH, MIN_ROLLUP_FEE, srcChain.verifierAddress)
        .then((response) => {
          address = response.address;
          trxHash = response.transactionHash;
        })
        .catch((err) => {
          console.error(common.RED, err);
          process.exit(1);
        });
    }
  } else {
    if (token.erc20 === 'true') {
      await MystikoCore.new(
        proxyAddress,
        dstChain.chainId,
        srcChain.verifierAddress,
        token.address,
        srcChain.hashAddress,
        MERKLE_TREE_HEIGHT,
      )
        .then((response) => {
          address = response.address;
          trxHash = response.transactionHash;
        })
        .catch((err) => {
          console.error(common.RED, err);
          process.exit(1);
        });
    } else {
      await MystikoCore.new(
        proxyAddress,
        dstChain.chainId,
        srcChain.verifierAddress,
        srcChain.hashAddress,
        MERKLE_TREE_HEIGHT,
      )
        .then((response) => {
          address = response.address;
          trxHash = response.transactionHash;
        })
        .catch((err) => {
          console.error(common.RED, err);
          process.exit(1);
        });
    }
  }

  let syncStart = await web3.eth
    .getTransaction(trxHash)
    .then((response) => {
      return response.blockNumber;
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });

  console.log('mystikoCore address ', address, ' block height ', syncStart);
  return { address, syncStart };
}

async function setMystikoPeerAddress(bridgeName, src, dst, config) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === null) {
    return null;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === null) {
    return null;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === null) {
    return null;
  }

  let mystikoCore = await MystikoCore.at(src.address);
  console.log('mystikoCore contract set peer contract address');
  await mystikoCore
    .setPeerContractAddress(dst.address)
    .then(() => {
      console.log('set peer contract address success ');
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });
}

async function transferTokneToContract(tokenAddress, contractAddress) {
  const testToken = await TestToken.at(tokenAddress);
  console.log('transfer token to contract ');
  const tokenDecimals = await testToken
    .decimals()
    .then((dicmals) => {
      return dicmals;
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });

  let amount = common.toDecimals('10000', tokenDecimals);
  if (process.env.DEFAULT_TOKEN_TRANSFER) {
    console.log('transfer amount ', process.env.DEFAULT_TOKEN_TRANSFER);
    amount = common.toDecimals(process.env.DEFAULT_TOKEN_TRANSFER, tokenDecimals);
  } else {
    console.log('transfer default amount 10000', process.env.DEFAULT_TOKEN_TRANSFER);
  }

  await testToken
    .transfer(contractAddress, amount)
    .then(() => {
      console.log('transfer token to contract success ');
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });
}

//deploy hasher and verifier
async function deployStep1() {
  if (process.argv.length !== 7) {
    console.log('should special parameter ');
    console.log('   step              : step1、step2、step3  ');
    return;
  }

  const network = process.argv[5];
  const mystikoNetwork = getMystikoNetwork(network);

  const config = common.loadConfig(mystikoNetwork);
  if (config === null) {
    return;
  }

  let rollup1VerifierAddress = '';
  console.log('deploy rollup verifier');
  //todo support rollup4 rollup16...
  await Rollup1Verifier.new()
    .then((verifier) => {
      rollup1VerifierAddress = verifier.address;
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });

  let withdrawVerifierAddress = '';
  console.log('deploy Withdraw verifier');
  await WithdrawVerifier.new()
    .then((withdrawVerifier) => {
      withdrawVerifierAddress = withdrawVerifier.address;
    })
    .catch((err) => {
      console.error(common.RED, err);
      process.exit(1);
    });

  console.log('rollup1 verifier address: ', rollup1VerifierAddress);
  console.log('withdrawVerifier address: ', withdrawVerifierAddress);
  common.saveBaseAddressConfig(
    mystikoNetwork,
    network,
    config,
    rollup1VerifierAddress,
    withdrawVerifierAddress,
  );
}

//deploy mystiko contract and configure peer contract address
async function deployStep2or3() {
  if (process.argv.length !== 10) {
    console.log('should special parameter ');
    console.log('   step                : step2  ');
    console.log('   bridge name         : tbridge、celer、poly、loop ');
    console.log('   destination network : ropsten、bsctestnet ...  ');
    console.log('   token name          : ETH、MTT、mUSD、BNB...  ');
    return;
  }

  const srcNetwork = process.argv[5];
  const step = process.argv[6];
  const bridgeName = process.argv[7];
  const dstNetwork = process.argv[8];
  const tokenName = process.argv[9];
  const mystikoNetwork = getMystikoNetwork(srcNetwork);

  let config = common.loadConfig(mystikoNetwork);
  if (config === null) {
    return;
  }

  const bridge = common.getBridgeConfig(config, bridgeName);
  if (bridge === null) {
    return;
  }

  const pairIndex = common.getBridgePairIndexByTokenName(bridge, srcNetwork, dstNetwork, tokenName);
  if (pairIndex === -1) {
    return;
  }

  const pair = common.getBridgePairByIndex(bridge, pairIndex);

  let i, j;
  if (bridgeName === 'loop') {
    i = 0;
    j = 0;
  } else {
    if (pair[0].network === srcNetwork) {
      i = 0;
      j = 1;
    } else if (pair[1].network === srcNetwork) {
      i = 1;
      j = 0;
    } else {
      console.error(common.RED, 'network wrong ');
      return;
    }
  }

  const src = pair[i];
  const dst = pair[j];
  let proxyAddress = common.getBridgeProxyAddress(bridge, pair[i].network, bridgeName, config);
  if (step === 'step2') {
    if (pair[i].network === 'development') {
      //deploy tbridge cross chain proxy for ci test
      proxyAddress = await deployTBridgeProxy();
    } else if (proxyAddress === '') {
      if (bridge.name === 'tbridge') {
        console.log('tbridge proxy not exist, create');
        proxyAddress = await deployTBridgeProxy();
        console.log('proxyAddress is ', proxyAddress);
        config = common.updateTBridgeCrossChainProxyConfig(config, pair[i].network, proxyAddress);
        if (config === null) {
          return;
        }
      } else if (bridge.name !== 'loop') {
        console.error(common.RED, 'bridge proxy not exist');
        return;
      }
    }

    const contractDeployInfo = await deployMystiko(bridgeName, src, dst, config, proxyAddress);
    if (contractDeployInfo === '') {
      return;
    }
    common.saveMystikoAddressConfig(mystikoNetwork, config, bridgeName, pairIndex, i, contractDeployInfo);
  } else if (step === 'step3') {
    if (src.address === '') {
      console.error(common.RED, 'src mystiko address is null');
      return;
    }

    if (dst.address === '') {
      console.error(common.RED, 'dst mystiko address is null');
      return;
    }

    if (bridgeName !== 'loop') {
      await setMystikoPeerAddress(bridgeName, src, dst, config);
    }

    coreConfig.savePeerConfig(mystikoNetwork, bridgeName, src, dst, config);
    if (bridgeName === 'tbridge') {
      tbridgeConfig.savePeerConfig(mystikoNetwork, src, dst, proxyAddress, config);
    }

    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain === null) {
      return null;
    }
    const srcToken = common.getChainTokenConfig(srcChain, src.token);
    if (srcToken === null) {
      return null;
    }

    //transfer token to contract
    if (mystikoNetwork === 'testnet' && srcToken.erc20 === 'true') {
      await transferTokneToContract(srcToken.address, src.address);
    }

    if (mystikoNetwork === 'development') {
      common.resetDefaultDevelopmentConfig(config);
    }
  } else {
    console.error(common.RED, 'not support step');
  }
}

module.exports = async function (callback) {
  const step = process.argv[6];
  if (step === 'step1') {
    await deployStep1();
  } else if (step === 'step2') {
    await deployStep2or3();
  } else if (step === 'step3') {
    await deployStep2or3();
  } else {
    console.error(common.RED, 'wrong step');
  }

  // invoke callback
  callback();
};
