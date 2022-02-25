const common = require('./common');

const TBRIDGE_TESTNET_CONFIG_FILE = 'deploy/tbridge/testnet.json';

module.exports = {
  getConfigFileName(mystikoNetwork) {
    if (mystikoNetwork === 'testnet') {
      return TBRIDGE_TESTNET_CONFIG_FILE;
    } else {
      console.error(common.RED, 'load tbridge config, network not support');
      return '';
    }
  },

  loadConfig(mystikoNetwork) {
    const fileName = this.getConfigFileName(mystikoNetwork);
    if (fileName === '') {
      return;
    }

    return common.readJsonFile(fileName);
  },

  saveConfig(mystikoNetwork, data) {
    const fileName = this.getConfigFileName(mystikoNetwork);
    if (fileName === null) {
      return;
    }

    return common.writeJsonFile(fileName, data);
  },

  savePeerConfig(mystikoNetwork, src, dst, proxyAddress, config) {
    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain === null) {
      return null;
    }

    const dstChain = common.getChainConfig(config, dst.network);
    if (dstChain === null) {
      return null;
    }

    let tbridgeConfig = this.loadConfig(mystikoNetwork);
    if (tbridgeConfig === null) {
      return;
    }

    for (let i = 0; i < tbridgeConfig.bridge.pairs.length; i++) {
      const pair = tbridgeConfig.bridge.pairs[i];
      if (
        pair.local.name === src.network &&
        pair.local.token === src.token &&
        pair.remote.name === dst.network
      ) {
        tbridgeConfig.bridge.pairs[i].local.mystikoAddress = src.address;
        tbridgeConfig.bridge.pairs[i].local.relayProxyAddress = proxyAddress;
        console.log('tbridge save config');
        this.saveConfig(mystikoNetwork, tbridgeConfig);
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
        this.saveConfig(mystikoNetwork, tbridgeConfig);
        return;
      }
    }

    console.log('tbridge add new pair');

    let pair = {
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

    this.saveConfig(mystikoNetwork, tbridgeConfig);
  },
};
