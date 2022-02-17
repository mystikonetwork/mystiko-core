const fs = require('fs');

const DEVELOPMENT_CONFIG_FILE = 'deploy/pair/development.json';
const TESTNET_CONFIG_FILE = 'deploy/pair/testnet.json';
const MAINNET_CONFIG_FILE = 'deploy/pair/mainnet.json';

const RED = '\x1b[31m';

module.exports = {
  RED: RED,

  readJsonFile(fileName) {
    const data = fs.readFileSync(fileName);
    return JSON.parse(data);
  },

  writeJsonFile(fileName, data) {
    var jsonData = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(fileName, jsonData);
    } catch (err) {
      console.error(err);
    }
  },

  loadConfig(mystikoNetwork) {
    if (mystikoNetwork == 'testnet') {
      return this.readJsonFile(TESTNET_CONFIG_FILE);
    } else if (mystikoNetwork == 'mainnet') {
      return this.readJsonFile(MAINNET_CONFIG_FILE);
    } else if (mystikoNetwork == 'development') {
      return this.readJsonFile(DEVELOPMENT_CONFIG_FILE);
    } else {
      console.error(this.RED, 'load config network not support');
      return null;
    }
  },

  saveConfig(mystikoNetwork, data) {
    if (mystikoNetwork == 'testnet') {
      this.writeJsonFile(TESTNET_CONFIG_FILE, data);
    } else if (mystikoNetwork == 'mainnet') {
      this.writeJsonFile(MAINNET_CONFIG_FILE, data);
    } else if (mystikoNetwork == 'development') {
      this.writeJsonFile(DEVELOPMENT_CONFIG_FILE, data);
    } else {
      console.error(this.RED, 'save base address config network not support');
      return;
    }
  },

  saveBaseAddressConfig(mystikoNetwork, network, config, hashAddress, verifierAddress) {
    for (let i = 0; i < config.chains.length; i++) {
      if (config.chains[i].network == network) {
        config.chains[i].hashAddress = hashAddress;
        config.chains[i].verifierAddress = verifierAddress;
        break;
      }
    }

    this.saveConfig(mystikoNetwork, config);
  },

  saveMystikoAddressConfig(mystikoNetwork, config, bridgeName, index, pos, address) {
    for (let i = 0; i < config.bridges.length; i++) {
      if (config.bridges[i].name == bridgeName) {
        config.bridges[i].pairs[index][pos].address = address;
        break;
      }
    }

    this.saveConfig(mystikoNetwork, config);
  },

  updateTBridgeCrossChainProxyConfig(config, network, proxyAddress) {
    for (let i = 0; i < config.bridges.length; i++) {
      if (config.bridges[i].name == 'tbridge') {
        for (let j = 0; j < config.bridges[i].proxys.length; j++) {
          if (config.bridges[i].proxys[j].network == network) {
            config.bridges[i].proxys[j].address = proxyAddress;
            return config;
          }
        }
      }
    }

    console.log(this.RED, 'update tbridge cross chain proxy error');
    return null;
  },

  getBridgeConfig(config, bridgeName) {
    for (const b of config.bridges) {
      if (b.name == bridgeName) {
        return b;
      }
    }

    console.error(this.RED, 'bridge configure not support');
    return null;
  },

  getBridgeProxyAddress(bridge, network) {
    for (const p of bridge.proxys) {
      if (p.network == network) {
        return p.address;
      }
    }

    return null;
  },

  getBridgePairIndexByTokenName(bridge, srcNetwork, dstNetwork, tokenName) {
    for (let i = 0; i < bridge.pairs.length; i++) {
      if (bridge.pairs[i].length == 1) {
        if (bridge.pairs[i][0].network == srcNetwork && bridge.pairs[i][0].token == tokenName) {
          return i;
        }
      } else {
        if (bridge.pairs[i][0].token == tokenName || bridge.pairs[i][1].token == tokenName) {
          if (
            (bridge.pairs[i][0].network == srcNetwork && bridge.pairs[i][1].network == dstNetwork) ||
            (bridge.pairs[i][1].network == srcNetwork && bridge.pairs[i][0].network == dstNetwork)
          ) {
            return i;
          }
        }
      }
    }

    console.error(this.RED, 'bridge pair token ', tokenName, ' not exist ');
    return -1;
  },

  getBridgePairByIndex(bridge, index) {
    return bridge.pairs[index];
  },

  getChainConfig(config, network) {
    for (const c of config.chains) {
      if (c.network == network) {
        return c;
      }
    }

    console.error(this.RED, 'chain configure not support');
    return null;
  },

  getChainTokenConfig(chain, name) {
    for (const t of chain.tokens) {
      if (t.name == name) {
        return t;
      }
    }

    console.error(this.RED, 'chain token configure not support');
    return null;
  },
};
