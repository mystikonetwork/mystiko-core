import {
  MystikoTBridgeProxy__factory,
  MystikoV2WithLoopERC20__factory,
  MystikoV2WithLoopMain__factory,
  MystikoWithCelerERC20__factory,
  MystikoWithCelerMain__factory,
  MystikoWithTBridgeERC20__factory,
  MystikoWithTBridgeMain__factory,
  Rollup1Verifier__factory,
  TestToken__factory,
  WithdrawVerifier__factory,
} from '../typechain';

const common = require('./common');
const coreConfig = require('./coreConfig');
const tbridgeConfig = require('./tbridgeConfig');

const mainNetwork = ['bsc', 'ethereum', 'moonbeam'];
let MystikoWithLoopERC20: MystikoV2WithLoopERC20__factory;
let MystikoWithLoopMain: MystikoV2WithLoopMain__factory;
let MystikoWithTBridgeERC20: MystikoWithTBridgeERC20__factory;
let MystikoWithTBridgeMain: MystikoWithTBridgeMain__factory;
let MystikoWithCelerERC20: MystikoWithCelerERC20__factory;
let MystikoWithCelerMain: MystikoWithCelerMain__factory;
let MystikoTBridgeProxy: MystikoTBridgeProxy__factory;
let TestToken: TestToken__factory;
let WithdrawVerifier: WithdrawVerifier__factory;
let Rollup1Verifier: Rollup1Verifier__factory;
// let Rollup4Verifier: Rollup1Verifier__factory;
// let Rollup16Verifier: Rollup1Verifier__factory;
let ethers: any;

function getMystikoContract(bridge: string, bErc20: string) {
  let coreContract: any;
  if (bridge === 'loop') {
    if (bErc20 === 'true') {
      coreContract = MystikoWithLoopERC20;
    } else {
      coreContract = MystikoWithLoopMain;
    }
  } else if (bridge === 'tbridge') {
    if (bErc20 === 'true') {
      coreContract = MystikoWithTBridgeERC20;
    } else {
      coreContract = MystikoWithTBridgeMain;
    }
  } else if (bridge === 'celer') {
    if (bErc20 === 'true') {
      coreContract = MystikoWithCelerERC20;
    } else {
      coreContract = MystikoWithCelerMain;
    }
  } else {
    console.error(common.LOGRED, 'bridge not support');
  }
  return coreContract;
}

function getMystikoNetwork(network: string) {
  if (network === 'development') {
    console.log('development network');
    return 'development';
  }

  for (const n of mainNetwork) {
    if (n === network) {
      console.log('main network');
      return 'mainnet';
    }
  }

  console.log('testnet network');
  return 'testnet';
}

async function deployTBridgeProxy() {
  console.log('deploy contract CrossChainProxy');
  console.log('deploy MystikoTBridgeProxy');
  const proxy = await MystikoTBridgeProxy.deploy();
  await proxy.deployed();

  if (process.env.TBRIDGE_PROXY_OPERATOR) {
    console.log('change  CrossChainProxy operator');
    await proxy
      .changeOperator(process.env.TBRIDGE_PROXY_OPERATOR)
      .then(() => {})
      .catch((err) => {
        console.error(common.LOGRED, err);
        process.exit(1);
      });
  }

  return proxy.address;
}

async function deployMystiko(bridgeName: string, src: any, dst: any, config: any, proxyAddress: string) {
  const { MERKLE_TREE_HEIGHT, ROOT_HISTORY_LENGTH, MIN_BRIDGE_FEE, MIN_EXECUTOR_FEE, MIN_ROLLUP_FEE } =
    process.env;
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === null) {
    return undefined;
  }

  if (srcChain.verifierAddress === '' || srcChain.hashAddress === '') {
    console.log('should do step1');
    return undefined;
  }

  const dstChain = common.getChainConfig(config, dst.network);
  if (srcChain === null) {
    return undefined;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === null) {
    return undefined;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === undefined) {
    return undefined;
  }

  console.log('deploy MystikoCore');
  let coreContract: any;
  if (bridgeName === 'loop') {
    if (token.erc20 === 'true') {
      // @ts-ignore
      coreContract = await MystikoCore.deploy(
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_ROLLUP_FEE,
        srcChain.verifierAddress,
        token.address,
      );
    } else {
      // @ts-ignore
      coreContract = await MystikoCore.deploy(
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_ROLLUP_FEE,
        srcChain.verifierAddress,
      );
    }
  } else {
    if (token.erc20 === 'true') {
      coreContract = await MystikoCore.deploy(
        proxyAddress,
        dstChain.chainId,
        // @ts-ignore
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_BRIDGE_FEE,
        MIN_EXECUTOR_FEE,
        MIN_ROLLUP_FEE,
        srcChain.verifierAddress,
        token.address,
      );
    } else {
      // @ts-ignore
      coreContract = await MystikoCore.deploy(
        proxyAddress,
        dstChain.chainId,
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_BRIDGE_FEE,
        MIN_EXECUTOR_FEE,
        MIN_ROLLUP_FEE,
        srcChain.verifierAddress,
      );
    }
  }

  const deployResponse = await coreContract.deployed();
  const { address } = deployResponse.address;
  const syncStart = await ethers.provider.getBlockNumber();

  // todo support set  min gas fee , flag minGasFee
  // todo support update contract , flag depositDisabled
  console.log('mystikoCore address ', address, ' block height ', syncStart);
  return { address, syncStart };
}

async function setMystikoPeerAddress(bridgeName: string, src: any, dst: any, config: any) {
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

  const mystikoCore = await MystikoCore.attach(src.address);
  console.log('mystikoCore contract set peer contract address');
  await mystikoCore
    // @ts-ignore
    .setPeerContractAddress(dst.address)
    .then(() => {
      console.log('set peer contract address success ');
    })
    .catch((err: any) => {
      console.error(common.LOGRED, err);
      process.exit(1);
    });
}

async function updateMystikoProxyAddress(bridgeName: string, src: any, proxyAddress: string, config: any) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === null) {
    return;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === null) {
    return;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === null) {
    return;
  }

  const mystikoCore = await MystikoCore.attach(src.address);
  console.log('mystikoCore contract set peer contract address');
  await mystikoCore
    // @ts-ignore
    .setRelayProxyAddress(proxyAddress)
    .then(() => {
      console.log('set contract proxy address success ');
    })
    .catch((err: any) => {
      console.error(common.LOGRED, err);
      process.exit(1);
    });
}

async function transferTokneToContract(tokenAddress: string, contractAddress: string) {
  const testToken = await TestToken.attach(tokenAddress);
  console.log('transfer token to contract ');
  const tokenDecimals = await testToken
    .decimals()
    .then((dicmals) => {
      return dicmals;
    })
    .catch((err) => {
      console.error(common.LOGRED, err);
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
      console.error(common.LOGRED, err);
      process.exit(1);
    });
}

// deploy hasher and verifier
async function deployStep1(taskArgs: any) {
  const network = taskArgs.src;
  const mystikoNetwork = getMystikoNetwork(network);

  const config = common.loadConfig(mystikoNetwork);
  if (config === null) {
    return;
  }

  console.log('deploy rollup verifier');
  // todo support rollup4 rollup16...
  const rollup1 = await Rollup1Verifier.deploy();
  const rollup1Response = await rollup1.deployed();
  const rollup1VerifierAddress = rollup1Response.address;

  console.log('deploy Withdraw verifier');
  const withdraw = await WithdrawVerifier.deploy();
  const withdrawResponse = await withdraw.deployed();
  const withdrawVerifierAddress = withdrawResponse.address;

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

// deploy mystiko contract and configure peer contract address
async function deployStep2or3(taskArgs: any) {
  const { srcNetwork, bridgeName, dstNetwork, step, tokenName } = taskArgs.src;

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

  let i: number;
  let j: number;
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
      console.error(common.LOGRED, 'network wrong ');
      return;
    }
  }

  const src = pair[i];
  const dst = pair[j];
  let proxyAddress = common.getBridgeProxyAddress(bridge, pair[i].network, bridgeName, config);
  if (step === 'step2') {
    if (pair[i].network === 'development') {
      // deploy tbridge cross chain proxy for ci test
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
        console.error(common.LOGRED, 'bridge proxy not exist');
        return;
      }
    }

    const contractDeployInfo = await deployMystiko(bridgeName, src, dst, config, proxyAddress);
    if (contractDeployInfo === undefined) {
      return;
    }
    common.saveMystikoAddressConfig(mystikoNetwork, config, bridgeName, pairIndex, i, contractDeployInfo);
  } else if (step === 'step3') {
    if (src.address === undefined || src.address === '') {
      console.error(common.LOGRED, 'src mystiko address is null');
      return;
    }

    if (dst.address === undefined || dst.address === '') {
      console.error(common.LOGRED, 'dst mystiko address is null');
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
      return;
    }
    const srcToken = common.getChainTokenConfig(srcChain, src.token);
    if (srcToken === null) {
      return;
    }

    // transfer token to contract
    if (mystikoNetwork === 'testnet' && srcToken.erc20 === 'true') {
      await transferTokneToContract(srcToken.address, src.address);
    }

    if (mystikoNetwork === 'development') {
      common.resetDefaultDevelopmentConfig(config);
    }
  } else if (step === 'updateProxy') {
    if (bridgeName !== 'loop') {
      await updateMystikoProxyAddress(bridgeName, src, proxyAddress, config);
    } else {
      console.error(common.LOGRED, 'not support update proxy for loop');
    }
  } else {
    console.error(common.LOGRED, 'not support step');
  }
}

async function initContractFactory() {
  MystikoWithLoopERC20 = await ethers.getContractFactory('MystikoV2WithLoopERC20');
  MystikoWithLoopMain = await ethers.getContractFactory('MystikoV2WithLoopMain');
  MystikoWithTBridgeERC20 = await ethers.getContractFactory('MystikoWithTBridgeERC20');
  MystikoWithTBridgeMain = await ethers.getContractFactory('MystikoWithTBridgeMain');
  MystikoWithCelerERC20 = await ethers.getContractFactory('MystikoWithCelerERC20');
  MystikoWithCelerMain = await ethers.getContractFactory('MystikoWithCelerMain');

  WithdrawVerifier = await ethers.getContractFactory('WithdrawVerifier');
  Rollup1Verifier = await ethers.getContractFactory('Rollup1Verifier');
  // Rollup4Verifier = await ethers.getContractFactory('Rollup4Verifier');
  // Rollup16Verifier = await ethers.getContractFactory('Rollup16Verifier');

  MystikoTBridgeProxy = await ethers.getContractFactory('MystikoTBridgeProxy');
  TestToken = await ethers.getContractFactory('TestToken');
}

export async function deploy(taskArgs: any, hre: any) {
  ethers = hre.ethers;
  await initContractFactory();

  const { step } = taskArgs;
  if (step === 'step1') {
    await deployStep1(taskArgs);
  } else if (step === 'step2') {
    await deployStep2or3(taskArgs);
  } else if (step === 'step3') {
    await deployStep2or3(taskArgs);
  } else if (step === 'updateProxy') {
    await deployStep2or3(taskArgs);
  } else {
    console.error(common.LOGRED, 'wrong step');
  }
}
