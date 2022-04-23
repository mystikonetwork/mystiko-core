import { readJsonFile, writeJsonFile } from './common/utils';
import { LOGRED } from './common/constant';

export const tbridgeTestnetConfigFile = './src/json/bridge/tbridge/testnet.json';
export const tbridgeDevelopmentConfigFile = './src/json/bridge/tbridge/development.json';

function getConfigFileName(mystikoNetwork: string) {
  if (mystikoNetwork === 'testnet') {
    return tbridgeTestnetConfigFile;
  }

  if (mystikoNetwork === 'development') {
    return tbridgeDevelopmentConfigFile;
  }

  console.error(LOGRED, 'load tbridge config, network not support');
  return '';
}

function loadTBridgeConfig(mystikoNetwork: string): any {
  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return undefined;
  }

  return readJsonFile(fileName);
}

function saveTBridgeConfig(mystikoNetwork: string, data: string) {
  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === null) {
    return;
  }
  const jsonData = JSON.stringify(data, null, 2);
  writeJsonFile(fileName, jsonData);
}

export function saveTBridgeJson(c: any) {
  const tbridgeConfig = loadTBridgeConfig(c.mystikoNetwork);
  if (tbridgeConfig === undefined) {
    return;
  }

  for (let i = 0; i < tbridgeConfig.bridge.pairs.length; i += 1) {
    const pair = tbridgeConfig.bridge.pairs[i];
    if (
      pair.local.name === c.pairSrcDepositCfg.network &&
      pair.local.token === c.pairSrcDepositCfg.token &&
      pair.remote.name === c.pairDstDepositCfg.network
    ) {
      tbridgeConfig.bridge.pairs[i].local.mystikoAddress = c.pairSrcDepositCfg.address;
      tbridgeConfig.bridge.pairs[i].local.relayProxyAddress = c.proxyCfg.address;
      console.log('tbridge save config');
      saveTBridgeConfig(c.mystikoNetwork, tbridgeConfig);
      return;
    }

    if (
      pair.remote.name === c.pairSrcDepositCfg.network &&
      pair.remote.token === c.pairSrcDepositCfg.token &&
      pair.local.name === c.pairDstDepositCfg.network
    ) {
      tbridgeConfig.bridge.pairs[i].remote.mystikoAddress = c.pairSrcDepositCfg.address;
      tbridgeConfig.bridge.pairs[i].remote.relayProxyAddress = c.proxyCfg.address;
      saveTBridgeConfig(c.mystikoNetwork, tbridgeConfig);
      return;
    }
  }

  console.log('tbridge add new pair');

  const pair = {
    local: {
      name: c.pairSrcDepositCfg.network,
      chainId: c.srcChainCfg.chainId,
      token: c.srcTokenCfg.assetSymbol,
      mystikoAddress: c.pairSrcDepositCfg.address,
      relayProxyAddress: c.proxyCfg.address,
    },
    remote: {
      name: c.pairDstDepositCfg.network,
      chainId: c.dstChainCfg.chainId,
      token: c.dstTokenCfg.assetSymbol,
    },
  };

  tbridgeConfig.bridge.pairs.push(pair);

  saveTBridgeConfig(c.mystikoNetwork, tbridgeConfig);
}
