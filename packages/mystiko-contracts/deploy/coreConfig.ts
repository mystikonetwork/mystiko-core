import {
  LOGRED,
  readJsonFile,
  writeJsonFile,
  getBridgeConfig,
  getChainConfig,
  getChainTokenConfig,
} from './common';

function getConfigFileName(mystikoNetwork: string) {
  let fileNameWithPath = '';
  if (mystikoNetwork === 'testnet') {
    fileNameWithPath = `${process.env.CLIENT_CONFIG_FILE_PATH}/testnet.json`;
  } else if (mystikoNetwork === 'mainnet') {
    fileNameWithPath = `${process.env.CLIENT_CONFIG_FILE_PATH}/mainnet.json`;
  } else if (mystikoNetwork === 'development') {
    fileNameWithPath = 'config/default/development.json';
  } else {
    console.error(LOGRED, 'load config network not support');
  }
  return fileNameWithPath;
}

export function loadConfig(mystikoNetwork: string): any {
  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return undefined;
  }

  return readJsonFile(fileName);
}

function saveConfig(mystikoNetwork: string, data: string) {
  if (mystikoNetwork === 'development') {
    return;
  }

  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return;
  }

  writeJsonFile(fileName, data);
}

function buildContractName(bridgeContractName: string, bERC20: string): string {
  if (bERC20 === 'true') {
    return `MystikoWith${bridgeContractName}ERC20`;
  }

  return `MystikoWith${bridgeContractName}Main`;
}

function addNewConfigContractAddress(
  bridgeName: string,
  coreConfig: any,
  chainName: string,
  contractName: string,
  tokenConfig: any,
  peerChainId: number,
  address: string,
  syncStart: number,
  peerContractAddress: string,
  version: string,
  circuits: string,
) {
  console.log('core add new contract');

  for (let i = 0; i < coreConfig.chains.length; i += 1) {
    if (coreConfig.chains[i].name !== chainName) {
      // eslint-disable-next-line
      continue;
    }

    const name = contractName;
    const { assetSymbol, assetDecimals } = tokenConfig;

    const newContract = {
      version,
      name,
      address,
      assetSymbol,
      assetDecimals,
      circuits,
      syncStart,
    };

    if (tokenConfig.erc20 === 'true') {
      // @ts-ignore
      newContract.assetAddress = tokenConfig.address;
    }

    if (bridgeName !== 'loop') {
      // @ts-ignore
      newContract.peerChainId = peerChainId;
      // @ts-ignore
      newContract.peerContractAddress = peerContractAddress;
    }

    coreConfig.chains[i].contracts.push(newContract);
    return coreConfig;
  }

  console.error(LOGRED, 'core add new contract error, should add chain configure');
  return null;
}

function updateConfigContractAddress(
  bridgeName: string,
  inCoreConfig: any,
  chainName: string,
  contractName: string,
  tokenConfig: any,
  peerChainId: number,
  address: string,
  syncStart: number,
  peerContractAddress: string,
  version: string,
  circuits: string,
) {
  const coreConfig = inCoreConfig;
  for (let i = 0; i < coreConfig.chains.length; i += 1) {
    if (coreConfig.chains[i].name !== chainName) {
      // eslint-disable-next-line
      continue;
    }

    for (let j = 0; j < coreConfig.chains[i].contracts.length; j += 1) {
      if (
        coreConfig.chains[i].contracts[j].name !== contractName ||
        coreConfig.chains[i].contracts[j].assetSymbol !== tokenConfig.name
      ) {
        // eslint-disable-next-line
        continue;
      }

      if (bridgeName !== 'loop' && coreConfig.chains[i].contracts[j].peerChainId !== peerChainId) {
        // eslint-disable-next-line
        continue;
      }

      if (
        tokenConfig.erc20 === 'true' &&
        coreConfig.chains[i].contracts[j].assetAddress !== tokenConfig.address
      ) {
        console.error(LOGRED, 'token address not match');
        return null;
      }

      if (bridgeName !== 'loop') {
        coreConfig.chains[i].contracts[j].address = address;
        coreConfig.chains[i].contracts[j].syncStart = syncStart;
        coreConfig.chains[i].contracts[j].peerContractAddress = peerContractAddress;
      } else {
        coreConfig.chains[i].contracts[j].address = address;
        coreConfig.chains[i].contracts[j].syncStart = syncStart;
      }

      return coreConfig;
    }
  }

  return addNewConfigContractAddress(
    bridgeName,
    coreConfig,
    chainName,
    contractName,
    tokenConfig,
    peerChainId,
    address,
    syncStart,
    peerContractAddress,
    version,
    circuits,
  );
}

export function savePeerConfig(mystikoNetwork: string, bridgeName: string, src: any, dst: any, config: any) {
  const bridge = getBridgeConfig(config, bridgeName);
  if (bridge === undefined) {
    console.error(LOGRED, 'bridge configure not support');
    return;
  }

  const srcChain = getChainConfig(config, src.network);
  if (srcChain === undefined) {
    return;
  }

  const dstChain = getChainConfig(config, dst.network);
  if (dstChain === undefined) {
    return;
  }

  const srcToken = getChainTokenConfig(srcChain, src.token);
  if (srcToken === undefined) {
    return;
  }

  const contractName = buildContractName(bridge.contractName, srcToken.erc20);

  let cliCoreConfig = loadConfig(mystikoNetwork);
  if (cliCoreConfig === null) {
    return;
  }

  cliCoreConfig = updateConfigContractAddress(
    bridgeName,
    cliCoreConfig,
    srcChain.name,
    contractName,
    srcToken,
    dstChain.chainId,
    src.address,
    src.syncStart,
    dst.address,
    config.version,
    config.circuits,
  );
  if (cliCoreConfig === null) {
    return;
  }

  saveConfig(mystikoNetwork, cliCoreConfig);
}
