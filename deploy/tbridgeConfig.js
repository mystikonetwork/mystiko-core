const common = require('./common');

const TBRIDGE_TESTNET_CONFIG_FILE = 'deploy/tbridge/testnet.json';

module.exports = {
  getConfigFileName(mystikoNetwork) {
    if (mystikoNetwork == 'testnet') {
      return TBRIDGE_TESTNET_CONFIG_FILE;
    } else {
      console.error(common.RED, 'load tbridge config, network not support');
      return null;
    }
  },

  loadConfig(mystikoNetwork) {
    const fileName = this.getConfigFileName(mystikoNetwork);
    if (fileName == null) {
      return;
    }

    return common.readJsonFile(fileName);
  },

  saveConfig(mystikoNetwork, data) {
    const fileName = this.getConfigFileName(mystikoNetwork);
    if (fileName == null) {
      return;
    }

    return common.writeJsonFile(fileName, data);
  },

  savePeerConfig(mystikoNetwork, src, dst, proxyAddress, config) {
    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain == null) {
      return null;
    }

    const dstChain = common.getChainConfig(config, dst.network);
    if (dstChain == null) {
      return null;
    }

    let tbridgeConfig = this.loadConfig(mystikoNetwork);
    if (tbridgeConfig == null) {
      return;
    }

    for (var i = 0; i < tbridgeConfig.bridge.pairs.length; i++) {
      const pair = tbridgeConfig.bridge.pairs[i];
      if (
        (pair.local.name == src.network &&
          pair.local.token == src.token &&
          pair.remote.name == dst.network) ||
        (pair.local.name == dst.network && pair.local.token == dst.token && pair.remote.name == src.network)
      ) {
        tbridgeConfig.bridge.pairs[i].local.mystikoAddress = src.address;
        tbridgeConfig.bridge.pairs[i].local.relayProxyAddress = proxyAddress;

        this.saveConfig(mystikoNetwork, tbridgeConfig);
        return;
      }
    }

    console.log('tbridge add new pair');

    var pair = {
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
