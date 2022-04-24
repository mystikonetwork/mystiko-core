import { getMystikoNetwork } from './common/utils';
import { LOGRED } from './common/constant';
import { loadConfig, saveConfig } from './config/config';
import { addEnqueueWhitelist, getOrDeployCommitPool, initPoolContractFactory } from './contract/commitment';
import { initTestTokenContractFactory, transferTokneToContract } from './contract/token';
import { getOrDeployTBridgeProxy, initTBridgeContractFactory } from './contract/tbridge';
import { deployDepositContract, initDepositContractFactory, setPeerContract } from './contract/depsit';
import { deployBaseContract, initBaseContractFactory } from './contract/base';
import { saveCoreContractJson } from './coreJson';
import { saveTBridgeJson } from './tbridgeJson';

let ethers: any;

function parseCfg(taskArgs: any) {
  const srcNetwork = taskArgs.src;
  const dstNetwork = taskArgs.dst;
  const bridgeName = taskArgs.bridge;
  const assetSymbol = taskArgs.token;

  const mystikoNetwork = getMystikoNetwork(srcNetwork);

  if (bridgeName === 'loop' && srcNetwork !== dstNetwork) {
    console.error(LOGRED, 'src and dst must be same when bridge type is loop');
    process.exit(-1);
  }

  const cfg = loadConfig(mystikoNetwork);
  if (cfg === undefined) {
    console.error(LOGRED, 'cfg load empty');
    process.exit(-1);
  }

  const bridgeCfg = cfg.getBridge(bridgeName);
  if (bridgeCfg === undefined) {
    console.error(LOGRED, 'bridge configure not exist');
    process.exit(-1);
  }

  const srcChainCfg = cfg.getChain(srcNetwork);
  if (srcChainCfg === undefined) {
    console.error(LOGRED, 'chain not configure');
    process.exit(-1);
  }

  const srcTokenCfg = srcChainCfg.getToken(assetSymbol);
  if (srcTokenCfg === undefined) {
    console.error(LOGRED, 'chain token not configure');
    process.exit(-1);
  }

  const depositPairCfg = bridgeCfg.getBridgeTokenPair(srcNetwork, assetSymbol, dstNetwork);
  if (depositPairCfg === undefined) {
    console.log(LOGRED, 'bridge token pair configure not exist');
    process.exit(-1);
  }

  const pairSrcDepositCfg = depositPairCfg.getPairDepositCfg(srcNetwork, assetSymbol);
  if (pairSrcDepositCfg === undefined) {
    console.log(LOGRED, 'src deposit pair not exist');
    process.exit(-1);
  }

  const pairSrcPoolCfg = bridgeCfg.getBridgeCommitmentPool(srcNetwork, assetSymbol);

  const pairDstDepositCfg = depositPairCfg.getPairPeerDepositCfg(srcNetwork, assetSymbol, dstNetwork);
  if (pairDstDepositCfg === undefined) {
    console.log(LOGRED, 'dst deposit pair  not exist');
    process.exit(-1);
  }

  const dstChainCfg = cfg.getChain(dstNetwork);
  if (dstChainCfg === undefined) {
    console.error(LOGRED, 'chain not configure');
    process.exit(-1);
  }

  const dstTokenName = pairDstDepositCfg.assetSymbol;
  const dstTokenCfg = dstChainCfg.getToken(dstTokenName);
  if (dstTokenCfg === undefined) {
    console.error(LOGRED, 'chain token not configure');
    process.exit(-1);
  }

  const proxyCfg = bridgeCfg.getBridgeProxyConfig(srcNetwork);

  const operatorCfg = cfg.getOperator();
  if (operatorCfg === undefined) {
    console.error(LOGRED, 'operator not configure');
    process.exit(-1);
  }

  return {
    mystikoNetwork,
    cfg,
    bridgeCfg,
    srcChainCfg,
    dstChainCfg,
    srcTokenCfg,
    dstTokenCfg,
    pairSrcDepositCfg,
    pairDstDepositCfg,
    pairSrcPoolCfg,
    proxyCfg,
    operatorCfg,
  };
}

// deploy hasher and verifier
async function deployStep1(taskArgs: any) {
  const c = parseCfg(taskArgs);
  await deployBaseContract(c.srcChainCfg);
  saveConfig(c.mystikoNetwork, c.cfg);
}

// deploy mystiko contract and config contract
async function deployStep2(taskArgs: any) {
  const c = parseCfg(taskArgs);

  if (!c.srcChainCfg.checkBaseAddress()) {
    console.error(LOGRED, 'base address not configure, should do step1 first');
    process.exit(-1);
  }

  const bridgeProxyAddress = await getOrDeployTBridgeProxy(
    c.bridgeCfg,
    c.proxyCfg,
    c.operatorCfg,
    c.srcChainCfg.network,
  );
  const commitmentPoolAddress = await getOrDeployCommitPool(
    c.bridgeCfg,
    c.srcChainCfg,
    c.srcTokenCfg,
    c.pairSrcPoolCfg,
    c.operatorCfg,
  );

  const depositAddress = await deployDepositContract(
    c.bridgeCfg,
    c.srcChainCfg,
    c.srcTokenCfg,
    c.dstTokenCfg,
    c.pairSrcDepositCfg,
    commitmentPoolAddress,
    bridgeProxyAddress,
  );
  await addEnqueueWhitelist(commitmentPoolAddress, depositAddress);
  saveConfig(c.mystikoNetwork, c.cfg);
}

// deploy mystiko contract and config contract
async function deployStep3(taskArgs: any) {
  const c = parseCfg(taskArgs);

  if (c.pairSrcDepositCfg.address === '' || c.pairDstDepositCfg.address === '') {
    console.error(LOGRED, 'token pair address not configure, should do step2 first');
    process.exit(-1);
  }

  // transfer token to contract
  if (c.srcTokenCfg.erc20 && c.bridgeCfg.name !== 'loop' && c.mystikoNetwork === 'testnet') {
    await transferTokneToContract(c.srcTokenCfg.address, c.pairSrcDepositCfg.address);
  }

  if (c.bridgeCfg.name !== 'loop') {
    await setPeerContract(c.pairSrcDepositCfg.address, c.dstChainCfg.chainId, c.pairDstDepositCfg.address);
  }

  saveCoreContractJson(c);

  if (c.bridgeCfg.name === 'tbridge') {
    saveTBridgeJson(c);
  }
}

export async function deploy(taskArgs: any, hre: any) {
  ethers = hre.ethers;
  await initBaseContractFactory(ethers);
  await initTestTokenContractFactory(ethers);
  await initTBridgeContractFactory(ethers);
  await initPoolContractFactory(ethers);
  await initDepositContractFactory(ethers);

  const { step } = taskArgs;
  if (step === 'step1') {
    await deployStep1(taskArgs);
  } else if (step === 'step2') {
    await deployStep2(taskArgs);
  } else if (step === 'step3') {
    await deployStep3(taskArgs);
  } else {
    console.error(LOGRED, 'wrong step');
  }
}
