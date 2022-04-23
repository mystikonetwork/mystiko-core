import { LOGRED } from './common/constant';
import { readJsonFile, writeJsonFile } from './common/utils';

function getCoreConfigFileName(mystikoNetwork: string) {
  let fileNameWithPath = '';
  if (mystikoNetwork === 'testnet') {
    fileNameWithPath = './src/json/core/testnet.json';
  } else if (mystikoNetwork === 'mainnet') {
    fileNameWithPath = `${process.env.CLIENT_CONFIG_FILE_PATH}/mainnet.json`;
  } else if (mystikoNetwork === 'development') {
    fileNameWithPath = './src/json/core/development.json';
  } else {
    console.error(LOGRED, 'load config network not support');
  }
  return fileNameWithPath;
}

function loadCoreConfig(mystikoNetwork: string): any {
  const fileName = getCoreConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return undefined;
  }
  return readJsonFile(fileName);
}

function saveCoreConfig(mystikoNetwork: string, data: string) {
  const fileName = getCoreConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return;
  }

  const jsonData = JSON.stringify(data, null, 2);
  writeJsonFile(fileName, jsonData);
}

function addTokenConfig(
  inCoreConfig: any,
  chainId: number,
  isERC20: boolean,
  assetSymbol: string,
  assetDecimals: number,
  assetAddress: string,
  recommendedAmounts: string[],
): any {
  const coreConfig = inCoreConfig;

  let i = 0;
  for (i = 0; i < coreConfig.chains.length; i += 1) {
    if (coreConfig.chains[i].chainId === chainId) {
      // eslint-disable-next-line
      break;
    }
  }

  if (i === coreConfig.chains.length) {
    console.log(LOGRED, 'core configure not exist');
    process.exit(-1);
  }

  const assetType = isERC20 ? 'erc20' : 'main';

  for (let j = 0; j < coreConfig.chains[i].assets.length; j += 1) {
    if (coreConfig.chains[i].assets[j].assetSymbol === assetSymbol) {
      coreConfig.chains[i].assets[j].assetType = assetType;
      coreConfig.chains[i].assets[j].assetDecimals = assetDecimals;
      coreConfig.chains[i].assets[j].recommendedAmounts = recommendedAmounts;

      if (isERC20) {
        coreConfig.chains[i].assets[j].assetAddress = assetAddress;
      }

      return coreConfig;
    }
  }

  console.log('add new token configure');
  const newToken = {
    assetType,
    assetSymbol,
    assetDecimals,
    recommendedAmounts,
  };

  if (isERC20) {
    // @ts-ignore
    newToken.assetAddress = assetAddress;
  }

  coreConfig.chains[i].assets.push(newToken);
  return coreConfig;
}

function addPoolContractConfig(
  inCoreConfig: any,
  chainId: number,
  version: number,
  address: string,
  startBlock: number,
  isERC20: boolean,
  assetAddress: string,
  minRollupFee: string,
  circuits: string[],
): any {
  const coreConfig = inCoreConfig;
  let i = 0;
  for (i = 0; i < coreConfig.chains.length; i += 1) {
    if (coreConfig.chains[i].chainId === chainId) {
      // eslint-disable-next-line
      break;
    }
  }
  if (i === coreConfig.chains.length) {
    console.log(LOGRED, 'core configure not exist');
    process.exit(-1);
  }

  for (let j = 0; j < coreConfig.chains[i].poolContracts.length; j += 1) {
    if (coreConfig.chains[i].poolContracts[j].address === address) {
      return coreConfig;
    }
  }

  console.log('add new commitment pool configure');

  const name = 'CommitmentPool';
  const newPoolContract = {
    version,
    name,
    address,
    startBlock,
  };

  // @ts-ignore
  newPoolContract.type = 'pool';

  if (isERC20) {
    // @ts-ignore
    newPoolContract.assetAddress = assetAddress;
  }
  // @ts-ignore
  newPoolContract.minRollupFee = minRollupFee;
  // @ts-ignore
  newPoolContract.circuits = circuits;

  coreConfig.chains[i].poolContracts.push(newPoolContract);
  return coreConfig;
}

function buildDepositContractName(bridgeContractName: string, bERC20: boolean): string {
  if (bERC20) {
    return `MystikoV2With${bridgeContractName}ERC20`;
  }

  return `MystikoV2With${bridgeContractName}Main`;
}

function addNewDepositContractConfig(
  inCoreConfig: any,
  chainId: number,
  version: number,
  name: string,
  address: string,
  startBlock: number,
  bridgeType: string,
  poolAddress: string,
  peerChainId: number,
  peerContractAddress: string,
  minAmount: string,
  minBridgeFee: string,
  minExecutorFee: string,
): any {
  const coreConfig = inCoreConfig;
  let i = 0;
  for (i = 0; i < coreConfig.chains.length; i += 1) {
    if (coreConfig.chains[i].chainId === chainId) {
      // eslint-disable-next-line
      break;
    }
  }

  if (i === coreConfig.chains.length) {
    console.log(LOGRED, 'core configure not exist');
    process.exit(-1);
  }

  for (let j = 0; j < coreConfig.chains[i].depositContracts.length; j += 1) {
    if (coreConfig.chains[i].depositContracts[j].address === address) {
      return coreConfig;
    }
  }

  console.log('add new deposit contract configure');
  const disabled = false;
  const newContract = {
    version,
    name,
    address,
    startBlock,
    bridgeType,
    poolAddress,
    disabled,
  };

  // @ts-ignore
  newContract.type = 'deposit';

  if (bridgeType !== 'loop') {
    // @ts-ignore
    newContract.peerChainId = peerChainId;
    // @ts-ignore
    newContract.peerContractAddress = peerContractAddress;
  }
  // @ts-ignore
  newContract.minAmount = minAmount;

  if (bridgeType !== 'loop') {
    // @ts-ignore
    newContract.minBridgeFee = minBridgeFee;
  }

  // @ts-ignore
  newContract.minExecutorFee = minExecutorFee;

  coreConfig.chains[i].depositContracts.push(newContract);
  return coreConfig;
}

export function saveCoreContractJson(c: any) {
  let coreCfg = loadCoreConfig(c.mystikoNetwork);
  if (coreCfg === undefined) {
    console.error(LOGRED, 'load core configure error');
    return;
  }

  coreCfg = addTokenConfig(
    coreCfg,
    c.srcChainCfg.chainId,
    c.srcTokenCfg.erc20,
    c.srcTokenCfg.assetSymbol,
    c.srcTokenCfg.assetDecimals,
    c.srcTokenCfg.address,
    c.srcTokenCfg.recommendedAmounts,
  );

  coreCfg = addPoolContractConfig(
    coreCfg,
    c.srcChainCfg.chainId,
    c.cfg.version,
    c.pairSrcPoolCfg.address,
    c.pairSrcPoolCfg.syncStart,
    c.srcTokenCfg.erc20,
    c.srcTokenCfg.address,
    c.srcTokenCfg.minRollupFee,
    c.cfg.circuits,
  );

  const contractName = buildDepositContractName(c.bridgeCfg.contractName, c.srcTokenCfg.erc20);
  coreCfg = addNewDepositContractConfig(
    coreCfg,
    c.srcChainCfg.chainId,
    c.cfg.version,
    contractName,
    c.pairSrcDepositCfg.address,
    c.pairSrcDepositCfg.syncStart,
    c.bridgeCfg.name,
    c.pairSrcPoolCfg.address,
    c.dstChainCfg.chainId,
    c.pairDstDepositCfg.address,
    c.srcTokenCfg.minAmount,
    c.srcChainCfg.minBridgeFee,
    c.srcTokenCfg.minExecutorFee,
  );

  saveCoreConfig(c.mystikoNetwork, coreCfg);
}
