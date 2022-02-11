const truffleCfg = require('../truffle-config');
const util = require('../src/utils');
const fs = require('fs');

const TESTNET_CONFIG_FILE = 'deploy/pair/testnet.json';
const MAINNET_CONFIG_FILE = 'deploy/pair/mainnet.json';

module.exports = {
  async loadConfig(network) {
    if (network == 'testnet') {
      return await util.readJsonFile(TESTNET_CONFIG_FILE);
    } else if (network == 'mainnet') {
      return await util.readJsonFile(MAINNET_CONFIG_FILE);
    } else {
      console.log('network configure not support');
      return null;
    }
  },

  saveJsonFile(fileName, data) {
    var jsonData = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(fileName, jsonData);
    } catch (err) {
      console.error(err);
    }
  },

  saveBaseAddressConfig(cfgNetwork, network, config, hashAddress, verifierAddress) {
    for (let i = 0; i < config.chains.length; i++) {
      if (config.chains[i].network == network) {
        config.chains[i].hashAddress = hashAddress;
        config.chains[i].verifierAddress = verifierAddress;
        break;
      }
    }

    if (cfgNetwork == 'testnet') {
      this.saveJsonFile(TESTNET_CONFIG_FILE, config);
    } else if (cfgNetwork == 'mainnet') {
      this.saveJsonFile(MAINNET_CONFIG_FILE, config);
    } else {
      console.log('network configure not support');
    }
  },

  saveMystikoAddressConfig(cfgNetwork, config, bridgeName, index, elem, address) {
    for (let i = 0; i < config.bridges.length; i++) {
      if (config.bridges[i].name == bridgeName) {
        config.bridges[i].pairs[index][elem].address = address;
        break;
      }
    }

    if (cfgNetwork == 'testnet') {
      this.saveJsonFile(TESTNET_CONFIG_FILE, config);
    } else if (cfgNetwork == 'mainnet') {
      this.saveJsonFile(MAINNET_CONFIG_FILE, config);
    } else {
      console.log('network configure not support');
    }
  },

  getBridgeConfig(config, bridgeName) {
    for (const b of config.bridges) {
      if (b.name == bridgeName) {
        return b;
      }
    }

    console.log('bridge configure not support');
    return null;
  },

  getBridgeProxyAddress(bridge, network) {
    for (const p of bridge.proxys) {
      if (p.network == network) {
        return p.address;
      }
    }

    console.log('bridge proxy not exist');
    return null;
  },

  getBridgePairByIndex(bridge, index) {
    if (index > bridge.pairs.length) {
      console.log('pair index error');
      return null;
    }

    return bridge.pairs[index];
  },

  getChainConfig(config, network) {
    for (const c of config.chains) {
      if (c.network == network) {
        return c;
      }
    }

    console.log('chain configure not support');
    return null;
  },

  getChainTokenConfig(chain, name) {
    for (const t of chain.tokens) {
      if (t.name == name) {
        return t;
      }
    }

    console.log('chain token configure not support');
    return null;
  },

  getProvider(network) {
    if (network == 'bsctestnet') {
      return truffleCfg.networks.bsctestnet.provider();
    } else if (network == 'ropsten') {
      return truffleCfg.networks.ropsten.provider();
    } else {
      console.log('provider configure not support');
      return null;
    }
  },
};
