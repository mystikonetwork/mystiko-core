const common = require('./common');

export const TBRIDGE_TESTNET_CONFIG_FILE = 'deploy/tbridge/testnet.json';

export function getConfigFileName(mystikoNetwork: string) {
  if (mystikoNetwork === 'testnet') {
    return TBRIDGE_TESTNET_CONFIG_FILE;
  }

  console.error(common.RED, 'load tbridge config, network not support');
  return '';
}

export function loadConfig(mystikoNetwork: string): any {
  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === '') {
    return undefined;
  }

  return common.readJsonFile(fileName);
}

export function saveConfig(mystikoNetwork: string, data: string) {
  const fileName = getConfigFileName(mystikoNetwork);
  if (fileName === null) {
    return;
  }

  common.writeJsonFile(fileName, data);
}

export function saveContractConfig(
  mystikoNetwork: string,
  src: any,
  dst: any,
  proxyAddress: string,
  config: any,
) {
  const srcChain = common.getChainConfig(config, src.network);
  if (srcChain === undefined) {
    return;
  }

  const dstChain = common.getChainConfig(config, dst.network);
  if (dstChain === undefined) {
    return;
  }

  const tbridgeConfig = loadConfig(mystikoNetwork);
  if (tbridgeConfig === undefined) {
    return;
  }

  for (let i = 0; i < tbridgeConfig.bridge.pairs.length; i += 1) {
    const pair = tbridgeConfig.bridge.pairs[i];
    if (
      pair.local.name === src.network &&
      pair.local.token === src.token &&
      pair.remote.name === dst.network
    ) {
      tbridgeConfig.bridge.pairs[i].local.mystikoAddress = src.address;
      tbridgeConfig.bridge.pairs[i].local.relayProxyAddress = proxyAddress;
      console.log('tbridge save config');
      saveConfig(mystikoNetwork, tbridgeConfig);
      return;
    }

    if (
      pair.remote.name === src.network &&
      pair.remote.token === src.token &&
      pair.local.name === dst.network
    ) {
      tbridgeConfig.bridge.pairs[i].remote.mystikoAddress = src.address;
      tbridgeConfig.bridge.pairs[i].remote.relayProxyAddress = proxyAddress;
      console.log('tbridge save config');
      saveConfig(mystikoNetwork, tbridgeConfig);
      return;
    }
  }

  console.log('tbridge add new pair');

  const pair = {
    local: {
      name: src.network,
      chainId: srcChain.chainId,
      token: src.token,
      mystikoAddress: src.address,
      relayProxyAddress: proxyAddress,
    },
    remote: {
      name: dst.network,
      chainId: dstChain.chainId,
      token: dst.token,
    },
  };

  tbridgeConfig.bridge.pairs.push(pair);

  saveConfig(mystikoNetwork, tbridgeConfig);
}
