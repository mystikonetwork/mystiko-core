const common = require('./common');

const CLI_TESTNET_CONFIG_FILE = 'config/cli/testnet.json';
const CLI_MAINNET_CONFIG_FILE = 'config/cli/mainnet.json';
const DEFAULT_TESTNET_CONFIG_FILE = 'config/default/testnet.json';
const DEFAULT_MAINNET_CONFIG_FILE = 'config/default/mainnet.json';

module.exports = {
  getConfigFileName(mystikoNetwork, mod) {
    if (mystikoNetwork == 'testnet') {
      if (mod == 'cli') {
        return CLI_TESTNET_CONFIG_FILE;
      } else {
        return DEFAULT_TESTNET_CONFIG_FILE;
      }
    } else if (mystikoNetwork == 'mainnet') {
      if (mod == 'cli') {
        return CLI_MAINNET_CONFIG_FILE;
      } else {
        return DEFAULT_MAINNET_CONFIG_FILE;
      }
    } else {
      console.error(common.RED, 'load config network not support');
      return null;
    }
  },

  loadConfig(mystikoNetwork, mod) {
    const fileName = this.getConfigFileName(mystikoNetwork, mod);
    if (fileName == null) {
      return;
    }

    return common.readJsonFile(fileName);
  },

  saveConfig(mystikoNetwork, mod, data) {
    const fileName = this.getConfigFileName(mystikoNetwork, mod);
    if (fileName == null) {
      return;
    }

    return common.writeJsonFile(fileName, data);
  },

  buildContractName(bridgeContractName, bERC20) {
    if (bERC20 == 'true') {
      return 'MystikoWith' + bridgeContractName + 'ERC20';
    } else {
      return 'MystikoWith' + bridgeContractName + 'Main';
    }
  },

  updateConfigContractAddress(
    bridgeName,
    coreConfig,
    chainName,
    contractName,
    token,
    peerChainId,
    address,
    peerContractAddress,
  ) {
    for (let i = 0; i < coreConfig.chains.length; i++) {
      if (coreConfig.chains[i].name != chainName) {
        continue;
      }

      for (let j = 0; j < coreConfig.chains[i].contracts.length; j++) {
        if (
          coreConfig.chains[i].contracts[j].name != contractName ||
          coreConfig.chains[i].contracts[j].assetSymbol != token.name
        ) {
          continue;
        }

        if (bridgeName != 'loop' && coreConfig.chains[i].contracts[j].peerChainId != peerChainId) {
          continue;
        }

        if (token.erc20 == 'true' && coreConfig.chains[i].contracts[j].assetAddress != token.address) {
          console.error(common.RED, 'token address not match');
          return null;
        }

        if (bridgeName != 'loop') {
          coreConfig.chains[i].contracts[j].address = address;
          coreConfig.chains[i].contracts[j].peerContractAddress = peerContractAddress;
        } else {
          coreConfig.chains[i].contracts[j].address = address;
        }

        return coreConfig;
      }
    }

    console.error(common.RED, 'contract configure not exist');
    return null;
  },

  savePeerConfig(mystikoNetwork, bridgeName, src, dst, config) {
    const bridge = common.getBridgeConfig(config, bridgeName);
    if (bridge == null) {
      return;
    }

    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain == null) {
      return null;
    }

    const dstChain = common.getChainConfig(config, dst.network);
    if (srcChain == null) {
      return null;
    }

    const srcToken = common.getChainTokenConfig(srcChain, src.token);
    if (srcToken == null) {
      return null;
    }

    const contractName = this.buildContractName(bridge.contractName, srcToken.erc20);

    let cliCoreConfig = this.loadConfig(mystikoNetwork, 'cli');
    if (cliCoreConfig == null) {
      return null;
    }

    cliCoreConfig = this.updateConfigContractAddress(
      bridgeName,
      cliCoreConfig,
      srcChain.name,
      contractName,
      srcToken,
      dstChain.chainId,
      src.address,
      dst.address,
    );
    if (cliCoreConfig == null) {
      return null;
    }
    this.saveConfig(mystikoNetwork, 'cli', cliCoreConfig);

    let defaultCoreConfig = this.loadConfig(mystikoNetwork, 'default');
    if (defaultCoreConfig == null) {
      return null;
    }

    defaultCoreConfig = this.updateConfigContractAddress(
      bridgeName,
      defaultCoreConfig,
      srcChain.name,
      contractName,
      srcToken,
      dstChain.chainId,
      src.address,
      dst.address,
    );
    if (defaultCoreConfig == null) {
      return null;
    }
    this.saveConfig(mystikoNetwork, 'default', defaultCoreConfig);
  },
};
