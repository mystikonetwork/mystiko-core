import { BaseConfig } from './common.js';
import { BridgeType, isValidBridgeType } from './contractConfig.js';
import { ChainConfig } from './chainConfig.js';
import { check, readJsonFile } from '../utils.js';
import { BaseBridgeConfig } from './bridgeConfig.js';

export class MystikoConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'version');
    BaseConfig.checkObjectArray(this.config, 'chains', false);
    BaseConfig.checkObjectArray(this.config, 'bridges', false);
    this._createChainConfigs();
    this._createBridgeConfigs();
    this._validateConfig();
  }

  get version() {
    return this.config['version'];
  }

  get chains() {
    return this.config['chains'];
  }

  get chainIds() {
    return Object.keys(this.chains).map((chainId) => parseInt(chainId));
  }

  get chainNames() {
    return Object.keys(this.chains).map((chainId) => this.chains[chainId].name);
  }

  get bridges() {
    return this.config['bridges'];
  }

  get bridgeTypes() {
    return Object.keys(this.bridges);
  }

  get bridgeNames() {
    return Object.keys(this.bridges).map((type) => this.bridges[type].name);
  }

  getChainConfig(chainId) {
    check(typeof chainId === 'number' || chainId instanceof Number, 'chainId should be number or Number');
    return this.chains[chainId];
  }

  getPeerChainIds(chainId) {
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      return chainConfig.peerChainIds;
    }
    return [];
  }

  getAssetSymbols(srcChainId, dstChainId) {
    const chainConfig = this.getChainConfig(srcChainId);
    if (chainConfig) {
      return chainConfig.getAssetSymbols(dstChainId);
    }
    return [];
  }

  getBridgeConfig(bridgeType) {
    check(typeof bridgeType === 'string', 'bridgeType should be string');
    check(isValidBridgeType(bridgeType), 'invalid bridge type');
    return this.bridges[bridgeType];
  }

  getContractConfig(srcChainId, dstChainId, assetSymbol, bridge) {
    check(typeof srcChainId === 'number', 'type of srcChainId should be number');
    check(typeof dstChainId === 'number', 'type of dstChainId should be number');
    check(typeof assetSymbol === 'string', 'type of tokenSymbol should be string');
    check(isValidBridgeType(bridge), bridge + ' is invalid bridge type');
    if (bridge === BridgeType.LOOP) {
      check(srcChainId === dstChainId, 'loop bridge should have equal chain ids');
    } else {
      check(srcChainId !== dstChainId, 'loop bridge should have non-equal chain ids');
    }
    const srcChainConfig = this.chains[srcChainId];
    check(srcChainConfig, 'chain ' + srcChainId + ' does not exist in config');
    for (let i = 0; i < srcChainConfig.contracts.length; i++) {
      const contract = srcChainConfig.contracts[i];
      if (contract.assetSymbol === assetSymbol && contract.bridgeType === bridge) {
        if (bridge === BridgeType.LOOP) {
          return contract;
        }
        if (contract.peerChainId === dstChainId) {
          return contract;
        }
      }
    }
    throw new Error('cannot find contract information with given parameters');
  }

  _createChainConfigs() {
    this.config['chains'] = {};
    if (this.rawConfig['chains']) {
      this.rawConfig['chains'].forEach((rawChainConfig) => {
        const conf = new ChainConfig(rawChainConfig);
        check(!this.config['chains'][conf.chainId], 'duplicate chain config');
        this.config['chains'][conf.chainId] = conf;
      });
    }
  }

  _createBridgeConfigs() {
    this.config['bridges'] = {};
    if (this.rawConfig['bridges']) {
      this.rawConfig['bridges'].forEach((rawBridgeConfig) => {
        const conf = BaseBridgeConfig.createConfig(rawBridgeConfig);
        check(!this.config['bridges'][conf.type], 'duplicate bridge config');
        this.config['bridges'][conf.type] = conf;
      });
    }
  }

  _validateConfig() {
    this.chainIds.forEach((chainId) => {
      const chainConfig = this.chains[chainId];
      chainConfig.contracts.forEach((contract) => {
        if (contract.bridgeType !== BridgeType.LOOP) {
          check(this.bridges[contract.bridgeType], `no bridge ${contract.bridgeType} config`);
          check(this.chains[contract.peerChainId], 'non-exist peerChainId');
          const peerChain = this.chains[contract.peerChainId];
          check(peerChain.getContract(contract.peerContractAddress), 'non-exist peerChainContract');
          const peerContract = peerChain.getContract(contract.peerContractAddress);
          check(peerContract.bridgeType === contract.bridgeType, 'bridge type does not match');
          check(peerContract.assetDecimals === contract.assetDecimals, 'token decimals does not match');
          check(peerContract.peerChainId === chainId, 'chain id does not match');
          check(peerContract.peerContractAddress === contract.address, 'contract address does not match');
        }
      });
    });
  }
}

export async function readFromFile(configFile) {
  check(typeof configFile === 'string', 'configFile should be string');
  const rawConfig = await readJsonFile(configFile);
  return new MystikoConfig(rawConfig);
}
