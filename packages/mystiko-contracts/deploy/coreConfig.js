require('dotenv').config();
const common = require('./common');

module.exports = {
  getConfigFileName(mystikoNetwork) {
    if (mystikoNetwork === 'testnet') {
      return process.env.CLIENT_CONFIG_FILE + 'testnet.json';
    } else if (mystikoNetwork === 'mainnet') {
      return process.env.CLIENT_CONFIG_FILE + 'mainnet.json';
    } else if (mystikoNetwork === 'development') {
      return process.env.CLIENT_CONFIG_FILE + 'development.json';
    } else {
      console.error(common.RED, 'load config network not support');
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
    if (mystikoNetwork === 'development'){
      return;
    }

    const fileName = this.getConfigFileName(mystikoNetwork);
    if (fileName === '') {
      return;
    }

    return common.writeJsonFile(fileName, data);
  },

  buildContractName(bridgeContractName, bERC20) {
    if (bERC20 === 'true') {
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
    version,
    circuits,
  ) {
    for (let i = 0; i < coreConfig.chains.length; i++) {
      if (coreConfig.chains[i].name !== chainName) {
        continue;
      }

      for (let j = 0; j < coreConfig.chains[i].contracts.length; j++) {
        if (
          coreConfig.chains[i].contracts[j].name !== contractName ||
          coreConfig.chains[i].contracts[j].assetSymbol !== token.name
        ) {
          continue;
        }

        if (bridgeName !== 'loop' && coreConfig.chains[i].contracts[j].peerChainId !== peerChainId) {
          continue;
        }

        if (token.erc20 === 'true' && coreConfig.chains[i].contracts[j].assetAddress !== token.address) {
          console.error(common.RED, 'token address not match');
          return null;
        }

        if (bridgeName !== 'loop') {
          coreConfig.chains[i].contracts[j].address = address;
          coreConfig.chains[i].contracts[j].peerContractAddress = peerContractAddress;
        } else {
          coreConfig.chains[i].contracts[j].address = address;
        }

        return coreConfig;
      }
    }

    return this.addNewConfigContractAddress(
      bridgeName,
      coreConfig,
      chainName,
      contractName,
      token,
      peerChainId,
      address,
      peerContractAddress,
      version,
      circuits,
    );
  },

  addNewConfigContractAddress(
    bridgeName,
    coreConfig,
    chainName,
    contractName,
    token,
    peerChainId,
    address,
    peerContractAddress,
    version,
    circuits,
  ) {
    console.log('core add new contract');

    for (let i = 0; i < coreConfig.chains.length; i++) {
      if (coreConfig.chains[i].name !== chainName) {
        continue;
      }

      let newContract = {
        version: version,
        name: contractName,
        address: address,
        assetSymbol: token.name,
        assetDecimals: token.assetDecimals,
        circuits: circuits,
      };

      if (token.erc20 === 'true') {
        newContract.assetAddress = token.address;
      }

      if (bridgeName !== 'loop') {
        newContract.peerChainId = peerChainId;
        newContract.peerContractAddress = peerContractAddress;
      }

      coreConfig.chains[i].contracts.push(newContract);
      return coreConfig;
    }

    console.error(common.RED, 'core add new contract error, should add chain configure');
    return null;
  },

  savePeerConfig(mystikoNetwork, bridgeName, src, dst, config) {
    const bridge = common.getBridgeConfig(config, bridgeName);
    if (bridge === null) {
      return;
    }

    const srcChain = common.getChainConfig(config, src.network);
    if (srcChain === null) {
      return null;
    }

    const dstChain = common.getChainConfig(config, dst.network);
    if (dstChain === null) {
      return null;
    }

    const srcToken = common.getChainTokenConfig(srcChain, src.token);
    if (srcToken === null) {
      return null;
    }

    const contractName = this.buildContractName(bridge.contractName, srcToken.erc20);

    let cliCoreConfig = this.loadConfig(mystikoNetwork);
    if (cliCoreConfig === null) {
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
      config.version,
      config.circuits,
    );
    if (cliCoreConfig === null) {
      return null;
    }
    this.saveConfig(mystikoNetwork, cliCoreConfig);
  },
};
