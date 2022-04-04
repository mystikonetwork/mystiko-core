const fs = require('fs');

export const DEVELOPMENT_CONFIG_FILE = 'deploy/pair/development.json';
export const TESTNET_CONFIG_FILE = 'deploy/pair/testnet.json';
export const MAINNET_CONFIG_FILE = 'deploy/pair/mainnet.json';

export const LOGRED = '\x1b[31m';

export function readJsonFile(fileName: string): any {
  if (!fs.existsSync(fileName)) {
    console.error(LOGRED, fileName, ' not exist');
    return undefined;
  }

  try {
    const data = fs.readFileSync(fileName);
    return JSON.parse(data);
  } catch (err) {
    console.error(LOGRED, err);
    console.error(LOGRED, 'read file error');
    return undefined;
  }
}

export function writeJsonFile(fileName: string, data: string) {
  const jsonData = JSON.stringify(data, null, 2);
  try {
    if (!fs.existsSync(fileName)) {
      console.error(LOGRED, fileName, ' not exist');
      return;
    }

    fs.writeFileSync(fileName, jsonData);
  } catch (err) {
    console.error(LOGRED, err);
    console.error(LOGRED, 'write file error');
  }
}

export function loadConfig(mystikoNetwork: string): any {
  let config: any;
  if (mystikoNetwork === 'testnet') {
    config = readJsonFile(TESTNET_CONFIG_FILE);
  } else if (mystikoNetwork === 'mainnet') {
    config = readJsonFile(MAINNET_CONFIG_FILE);
  } else if (mystikoNetwork === 'development') {
    config = readJsonFile(DEVELOPMENT_CONFIG_FILE);
  } else {
    console.error(LOGRED, 'load config network not support');
  }
  return config;
}

export function saveConfig(mystikoNetwork: string, data: string) {
  if (mystikoNetwork === 'testnet') {
    writeJsonFile(TESTNET_CONFIG_FILE, data);
  } else if (mystikoNetwork === 'mainnet') {
    writeJsonFile(MAINNET_CONFIG_FILE, data);
  } else if (mystikoNetwork === 'development') {
    writeJsonFile(DEVELOPMENT_CONFIG_FILE, data);
  } else {
    console.error(LOGRED, 'save base address config network not support');
  }
}

export function resetDefaultDevelopmentConfig(inConfig: any) {
  const config = inConfig;
  config.chains[0].rollup1Address = '';
  config.chains[0].verifierAddress = '';
  config.bridges[0].pairs[0][0].address = '';
  config.bridges[0].pairs[0][0].syncStart = '';

  saveConfig('development', config);
}

export function saveBaseAddressConfig(
  mystikoNetwork: string,
  network: string,
  inConfig: any,
  rollup1Address: string,
  verifierAddress: string,
) {
  const config = inConfig;
  for (let i = 0; i < config.chains.length; i += 1) {
    if (config.chains[i].network === network) {
      config.chains[i].rollup1Address = rollup1Address;
      config.chains[i].verifierAddress = verifierAddress;
      break;
    }
  }

  saveConfig(mystikoNetwork, config);
}

export function saveMystikoAddressConfig(
  mystikoNetwork: string,
  inConfig: any,
  bridgeName: string,
  index: number,
  pos: number,
  contractDeployInfo: any,
) {
  const config = inConfig;
  for (let i = 0; i < config.bridges.length; i += 1) {
    if (config.bridges[i].name === bridgeName) {
      config.bridges[i].pairs[index][pos].address = contractDeployInfo.address;
      config.bridges[i].pairs[index][pos].syncStart = contractDeployInfo.syncStart;
      break;
    }
  }

  saveConfig(mystikoNetwork, config);
}

export function updateTBridgeCrossChainProxyConfig(inConfig: any, network: string, proxyAddress: string) {
  const config = inConfig;
  for (let i = 0; i < config.bridges.length; i += 1) {
    if (config.bridges[i].name === 'tbridge') {
      for (let j = 0; j < config.bridges[i].proxys.length; j += 1) {
        if (config.bridges[i].proxys[j].network === network) {
          config.bridges[i].proxys[j].address = proxyAddress;
          return config;
        }
      }
    }
  }

  console.log('add new tbridge cross chain proxy');

  for (let i = 0; i < config.bridges.length; i += 1) {
    if (config.bridges[i].name === 'tbridge') {
      const proxy = {
        network: network,
        address: proxyAddress,
      };
      config.bridges[i].proxys.push(proxy);
      return config;
    }
  }

  console.log(LOGRED, 'update new tbridge cross chain proxy error');
  return null;
}

export function getBridgeConfig(config: any, bridgeName: string) {
  for (const b of config.bridges) {
    if (b.name === bridgeName) {
      return b;
    }
  }

  console.error(LOGRED, 'bridge configure not support');
  return null;
}

export function getBridgeProxyAddress(bridge: any, network: string) {
  for (const p of bridge.proxys) {
    if (p.network === network) {
      return p.address;
    }
  }

  return '';
}

export function getBridgePairIndexByTokenName(
  bridge: any,
  srcNetwork: string,
  dstNetwork: string,
  tokenName: string,
) {
  for (let i = 0; i < bridge.pairs.length; i += 1) {
    if (bridge.pairs[i].length === 1) {
      if (bridge.pairs[i][0].network === srcNetwork && bridge.pairs[i][0].token === tokenName) {
        return i;
      }
    }

    if (bridge.pairs[i][0].token === tokenName || bridge.pairs[i][1].token === tokenName) {
      if (
        (bridge.pairs[i][0].network === srcNetwork && bridge.pairs[i][1].network === dstNetwork) ||
        (bridge.pairs[i][1].network === srcNetwork && bridge.pairs[i][0].network === dstNetwork)
      ) {
        return i;
      }
    }
  }

  console.error(LOGRED, 'bridge pair token ', tokenName, ' not exist ');
  return -1;
}

export function getBridgePairByIndex(bridge: any, index: number) {
  return bridge.pairs[index];
}

export function getChainConfig(config: any, network: string) {
  for (const c of config.chains) {
    if (c.network === network) {
      return c;
    }
  }

  console.error(LOGRED, 'chain configure not support');
  return null;
}

export function getChainTokenConfig(chain: any, name: string) {
  for (const t of chain.tokens) {
    if (t.name === name) {
      return t;
    }
  }

  console.error(LOGRED, 'chain token configure not support');
  return null;
}

export function toDecimals(amount: number, decimals: number) {
  let padDecimals = '';
  for (let i = 0; i < decimals; i += 1) {
    padDecimals += '0';
  }
  return amount + padDecimals;
}