import {
  MystikoTBridgeProxy__factory,
  MystikoV2WithLoopERC20__factory,
  MystikoV2WithLoopMain__factory,
  MystikoV2WithCelerERC20__factory,
  MystikoV2WithCelerMain__factory,
  MystikoV2WithTBridgeERC20__factory,
  MystikoV2WithTBridgeMain__factory,
  Transaction1x0Verifier__factory,
  Transaction1x1Verifier__factory,
  Transaction1x2Verifier__factory,
  Transaction2x0Verifier__factory,
  Transaction2x1Verifier__factory,
  Transaction2x2Verifier__factory,
  Rollup1Verifier__factory,
  Rollup4Verifier__factory,
  Rollup16Verifier__factory,
  TestToken__factory,
  Hasher3__factory,
} from '@mystikonetwork/contracts-abi';

const common = require('./common');
const coreConfig = require('./coreConfig');
const tbridgeConfig = require('./tbridgeConfig');

const mainNetwork = ['bsc', 'ethereum', 'moonbeam'];
let MystikoV2WithLoopERC20: MystikoV2WithLoopERC20__factory;
let MystikoV2WithLoopMain: MystikoV2WithLoopMain__factory;
let MystikoV2WithTBridgeERC20: MystikoV2WithTBridgeERC20__factory;
let MystikoV2WithTBridgeMain: MystikoV2WithTBridgeMain__factory;
let MystikoV2WithCelerERC20: MystikoV2WithCelerERC20__factory;
let MystikoV2WithCelerMain: MystikoV2WithCelerMain__factory;
let MystikoTBridgeProxy: MystikoTBridgeProxy__factory;
let TestToken: TestToken__factory;
let Transaction1x0Verifier: Transaction1x0Verifier__factory;
let Transaction1x1Verifier: Transaction1x1Verifier__factory;
let Transaction1x2Verifier: Transaction1x2Verifier__factory;
let Transaction2x0Verifier: Transaction2x0Verifier__factory;
let Transaction2x1Verifier: Transaction2x1Verifier__factory;
let Transaction2x2Verifier: Transaction2x2Verifier__factory;
let Rollup1Verifier: Rollup1Verifier__factory;
let Rollup4Verifier: Rollup4Verifier__factory;
let Rollup16Verifier: Rollup16Verifier__factory;
let Hasher3: Hasher3__factory;

let ethers: any;

function getMystikoContract(bridge: string, bErc20: string) {
  let coreContract: any;
  if (bridge === 'loop') {
    if (bErc20 === 'true') {
      coreContract = MystikoV2WithLoopERC20;
    } else {
      coreContract = MystikoV2WithLoopMain;
    }
  } else if (bridge === 'tbridge') {
    if (bErc20 === 'true') {
      coreContract = MystikoV2WithTBridgeERC20;
    } else {
      coreContract = MystikoV2WithTBridgeMain;
    }
  } else if (bridge === 'celer') {
    if (bErc20 === 'true') {
      coreContract = MystikoV2WithCelerERC20;
    } else {
      coreContract = MystikoV2WithCelerMain;
    }
  } else {
    console.error(common.LOGRED, 'bridge not support');
  }
  return coreContract;
}

function getMystikoNetwork(network: string) {
  if (network === 'hardhat') {
    console.log('development network');
    return 'development';
  }
  let networkType = 'testnet';
  mainNetwork.forEach((n: any) => {
    if (n === network) {
      networkType = 'mainnet';
    }
  });

  return networkType;
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
  if (srcChain === undefined) {
    return undefined;
  }

  if (srcChain.hasher3Address === '' || srcChain.hasher3Address === undefined) {
    console.log('should do step1');
    return undefined;
  }

  const dstChain = common.getChainConfig(config, dst.network);
  if (srcChain === undefined) {
    return undefined;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === undefined) {
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
        srcChain.hasher3Address,
        token.address,
      );
    } else {
      // @ts-ignore
      coreContract = await MystikoCore.deploy(
        MERKLE_TREE_HEIGHT,
        ROOT_HISTORY_LENGTH,
        MIN_ROLLUP_FEE,
        srcChain.hasher3Address,
      );
    }
  } else if (token.erc20 === 'true') {
    coreContract = await MystikoCore.deploy(
      proxyAddress,
      dstChain.chainId,
      // @ts-ignore
      MERKLE_TREE_HEIGHT,
      ROOT_HISTORY_LENGTH,
      MIN_BRIDGE_FEE,
      MIN_EXECUTOR_FEE,
      MIN_ROLLUP_FEE,
      srcChain.hasher3Address,
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
      srcChain.hasher3Address,
    );
  }

  const deployResponse = await coreContract.deployed();
  const { address } = deployResponse;
  const syncStart = await ethers.provider.getBlockNumber();

  // todo support set  min gas fee , flag minGasFee
  // todo support update contract , flag depositDisabled
  console.log('mystikoCore address ', address, ' block height ', syncStart);
  return { address, syncStart };
}

async function setMystikoRollupAndTransact(bridgeName: string, src: any, dst: any, config: any) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === undefined) {
    return;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === undefined) {
    return;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === undefined) {
    return;
  }

  const mystikoCore = await MystikoCore.attach(src.address);
  console.log('mystikoCore enable rollup');
  try {
    await mystikoCore.enableRollupVerifier(1, srcChain.rollup1Address);
    await mystikoCore.enableRollupVerifier(4, srcChain.rollup4Address);
    await mystikoCore.enableRollupVerifier(16, srcChain.rollup16Address);
  } catch (err: any) {
    console.error(common.LOGRED, err);
    process.exit(1);
  }

  console.log('mystikoCore enable transact');
  try {
    await mystikoCore.enableTransactVerifier(1, 0, srcChain.transaction1x0VerifierAddress);
    await mystikoCore.enableTransactVerifier(1, 1, srcChain.transaction1x1VerifierAddress);
    await mystikoCore.enableTransactVerifier(1, 2, srcChain.transaction1x2VerifierAddress);
    await mystikoCore.enableTransactVerifier(2, 0, srcChain.transaction2x0VerifierAddress);
    await mystikoCore.enableTransactVerifier(2, 1, srcChain.transaction2x1VerifierAddress);
    await mystikoCore.enableTransactVerifier(2, 2, srcChain.transaction2x2VerifierAddress);
  } catch (err: any) {
    console.error(common.LOGRED, err);
    process.exit(1);
  }
}

async function setMystikoPeerAddress(bridgeName: string, src: any, dst: any, config: any) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === undefined) {
    return;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === undefined) {
    return;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === undefined) {
    return;
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
  if (srcChain === undefined) {
    return;
  }

  const token = common.getChainTokenConfig(srcChain, src.token);
  if (token === undefined) {
    return;
  }

  const MystikoCore = getMystikoContract(bridgeName, token.erc20);
  if (MystikoCore === undefined) {
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
  let tokenDecimals;
  await testToken
    .decimals()
    .then((dicmals) => {
      tokenDecimals = dicmals;
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
  if (config === undefined) {
    return;
  }

  console.log('deploy hasher3');
  const hasher3 = await Hasher3.deploy();
  const hasher3Response = await hasher3.deployed();
  const hasher3Address = hasher3Response.address;

  console.log('deploy rollup verifier');
  const rollup1 = await Rollup1Verifier.deploy();
  const rollup1Response = await rollup1.deployed();
  const rollup1VerifierAddress = rollup1Response.address;

  const rollup4 = await Rollup4Verifier.deploy();
  const rollup4Response = await rollup4.deployed();
  const rollup4VerifierAddress = rollup4Response.address;

  const rollup16 = await Rollup16Verifier.deploy();
  const rollup16Response = await rollup16.deployed();
  const rollup16VerifierAddress = rollup16Response.address;

  console.log('deploy transaction verifier');
  const transaction1x0Verifier = await Transaction1x0Verifier.deploy();
  const transaction1x0VerifierRsp = await transaction1x0Verifier.deployed();
  const transaction1x0VerifierAddress = transaction1x0VerifierRsp.address;

  const transaction1x1Verifier = await Transaction1x1Verifier.deploy();
  const transaction1x1VerifierRsp = await transaction1x1Verifier.deployed();
  const transaction1x1VerifierAddress = transaction1x1VerifierRsp.address;

  const transaction1x2Verifier = await Transaction1x2Verifier.deploy();
  const transaction1x2VerifierRsp = await transaction1x2Verifier.deployed();
  const transaction1x2VerifierAddress = transaction1x2VerifierRsp.address;

  const transaction2x0Verifier = await Transaction2x0Verifier.deploy();
  const transaction2x0VerifierRsp = await transaction2x0Verifier.deployed();
  const transaction2x0VerifierAddress = transaction2x0VerifierRsp.address;

  const transaction2x1Verifier = await Transaction2x1Verifier.deploy();
  const transaction2x1VerifierRsp = await transaction2x1Verifier.deployed();
  const transaction2x1VerifierAddress = transaction2x1VerifierRsp.address;

  const transaction2x2Verifier = await Transaction2x2Verifier.deploy();
  const transaction2x2VerifierRsp = await transaction2x2Verifier.deployed();
  const transaction2x2VerifierAddress = transaction2x2VerifierRsp.address;

  console.log('hasher3 address: ', hasher3Address);

  console.log('rollup1 verifier address: ', rollup1VerifierAddress);
  console.log('rollup4 verifier address: ', rollup4VerifierAddress);
  console.log('rollup16 verifier address: ', rollup16VerifierAddress);

  console.log('transaction1x0 verifier address: ', transaction1x0VerifierAddress);
  console.log('transaction1x1 verifier address: ', transaction1x1VerifierAddress);
  console.log('transaction1x2 verifier address: ', transaction1x2VerifierAddress);
  console.log('transaction2x0 verifier address: ', transaction2x0VerifierAddress);
  console.log('transaction2x1 verifier address: ', transaction2x1VerifierAddress);
  console.log('transaction2x2 verifier address: ', transaction2x2VerifierAddress);

  common.saveBaseAddressConfig(
    mystikoNetwork,
    network,
    config,
    hasher3Address,
    rollup1VerifierAddress,
    rollup4VerifierAddress,
    rollup16VerifierAddress,
    transaction1x0VerifierAddress,
    transaction1x1VerifierAddress,
    transaction1x2VerifierAddress,
    transaction2x0VerifierAddress,
    transaction2x1VerifierAddress,
    transaction2x2VerifierAddress,
  );
}

// deploy mystiko contract and configure peer contract address
async function deployStep2or3(taskArgs: any) {
  const { step } = taskArgs;
  const srcNetwork = taskArgs.src;
  const dstNetwork = taskArgs.dst;
  const bridgeName = taskArgs.bridge;
  const tokenName = taskArgs.token;

  const mystikoNetwork = getMystikoNetwork(srcNetwork);

  let config = common.loadConfig(mystikoNetwork);
  if (config === undefined) {
    return;
  }

  const bridge = common.getBridgeConfig(config, bridgeName);
  if (bridge === undefined) {
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
  } else if (pair[0].network === srcNetwork) {
    i = 0;
    j = 1;
  } else if (pair[1].network === srcNetwork) {
    i = 1;
    j = 0;
  } else {
    console.error(common.LOGRED, 'network wrong ');
    return;
  }

  const src = pair[i];
  const dst = pair[j];
  let proxyAddress = common.getBridgeProxyAddress(bridge, pair[i].network, bridgeName, config);
  if (step === 'step2') {
    if (pair[i].network === 'development') {
      // deploy tbridge cross chain proxy for ci test
      proxyAddress = await deployTBridgeProxy();
    } else if (proxyAddress === undefined) {
      if (bridge.name === 'tbridge') {
        console.log('tbridge proxy not exist, create');
        proxyAddress = await deployTBridgeProxy();
        console.log('proxyAddress is ', proxyAddress);
        config = common.updateTBridgeCrossChainProxyConfig(config, pair[i].network, proxyAddress);
        if (config === undefined) {
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

    await setMystikoRollupAndTransact(bridgeName, src, dst, config);

    if (bridgeName !== 'loop') {
      await setMystikoPeerAddress(bridgeName, src, dst, config);
    }

    coreConfig.saveContractConfig(mystikoNetwork, bridgeName, src, dst, config);
    if (bridgeName === 'tbridge') {
      tbridgeConfig.saveContractConfig(mystikoNetwork, src, dst, proxyAddress, config);
    }

    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain === undefined) {
      return;
    }
    const srcToken = common.getChainTokenConfig(srcChain, src.token);
    if (srcToken === undefined) {
      return;
    }

    // transfer token to contract
    if (bridgeName !== 'loop' && mystikoNetwork === 'testnet' && srcToken.erc20 === 'true') {
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
  MystikoV2WithLoopERC20 = await ethers.getContractFactory('MystikoV2WithLoopERC20');
  MystikoV2WithLoopMain = await ethers.getContractFactory('MystikoV2WithLoopMain');
  MystikoV2WithTBridgeERC20 = await ethers.getContractFactory('MystikoV2WithTBridgeERC20');
  MystikoV2WithTBridgeMain = await ethers.getContractFactory('MystikoV2WithTBridgeMain');
  MystikoV2WithCelerERC20 = await ethers.getContractFactory('MystikoV2WithCelerERC20');
  MystikoV2WithCelerMain = await ethers.getContractFactory('MystikoV2WithCelerMain');

  const Hasher3Artifact = await common.getArtifact('Hasher3');
  Hasher3 = (await ethers.getContractFactoryFromArtifact(Hasher3Artifact)) as Hasher3__factory;

  Rollup1Verifier = await ethers.getContractFactory('Rollup1Verifier');
  Rollup4Verifier = await ethers.getContractFactory('Rollup4Verifier');
  Rollup16Verifier = await ethers.getContractFactory('Rollup16Verifier');

  Transaction1x0Verifier = await ethers.getContractFactory('Transaction1x0Verifier');
  Transaction1x1Verifier = await ethers.getContractFactory('Transaction1x1Verifier');
  Transaction1x2Verifier = await ethers.getContractFactory('Transaction1x2Verifier');
  Transaction2x0Verifier = await ethers.getContractFactory('Transaction2x0Verifier');
  Transaction2x1Verifier = await ethers.getContractFactory('Transaction2x1Verifier');
  Transaction2x2Verifier = await ethers.getContractFactory('Transaction2x2Verifier');

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
