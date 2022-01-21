import { BaseConfig } from './common.js';
import { BridgeType, isValidBridgeType } from './contractConfig.js';
import { ChainConfig } from './chainConfig.js';
import { check, readJsonFile } from '../utils.js';
import { BaseBridgeConfig } from './bridgeConfig.js';
import { CircuitConfig } from './circuitConfig.js';

export class MystikoConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'version');
    BaseConfig.checkObjectArray(this.config, 'chains', false);
    BaseConfig.checkObjectArray(this.config, 'bridges', false);
    BaseConfig.checkObjectArray(this.config, 'circuits', false);
    this._createChainConfigs();
    this._createBridgeConfigs();
    this._createCircuitConfigs();
    this._validateConfig();
  }

  get version() {
    return this.config['version'];
  }

  get chains() {
    return Object.values(this.config['chains']);
  }

  get circuits() {
    return Object.values(this.config['circuits']);
  }

  getChainConfig(chainId) {
    check(typeof chainId === 'number' || chainId instanceof Number, 'chainId should be number or Number');
    return this.config['chains'][chainId];
  }

  getPeerChains(chainId) {
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      return chainConfig.peerChainIds.map((peerChainId) => this.getChainConfig(peerChainId));
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

  getBridges(srcChainId, dstChainId, assetSymbol) {
    check(typeof srcChainId === 'number', 'type of srcChainId should be number');
    check(typeof dstChainId === 'number', 'type of dstChainId should be number');
    check(typeof assetSymbol === 'string', 'type of tokenSymbol should be string');
    const bridges = {};
    if (srcChainId !== dstChainId) {
      const chainConfig = this.getChainConfig(srcChainId);
      if (chainConfig) {
        chainConfig.contracts.forEach((contractConfig) => {
          if (dstChainId === contractConfig.peerChainId && assetSymbol === contractConfig.assetSymbol) {
            bridges[contractConfig.bridgeType] = this.getBridgeConfig(contractConfig.bridgeType);
          }
        });
      }
    }
    return Object.values(bridges);
  }

  getBridgeConfig(bridgeType) {
    check(typeof bridgeType === 'string', 'bridgeType should be string');
    check(isValidBridgeType(bridgeType), 'invalid bridge type');
    return this.config['bridges'][bridgeType];
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
    const srcChainConfig = this.config['chains'][srcChainId];
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

  getCircuitConfig(name) {
    check(typeof name === 'string', 'name should be string');
    return this.config['circuits'][name];
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

  _createCircuitConfigs() {
    this.config['circuits'] = {};
    if (this.rawConfig['circuits']) {
      this.rawConfig['circuits'].forEach((rawCircuitConfig) => {
        const conf = new CircuitConfig(rawCircuitConfig);
        check(!this.config['circuits'][conf.name], 'duplicate circuit config');
        this.config['circuits'][conf.name] = conf;
      });
    }
  }

  _validateConfig() {
    this.chains.forEach((chainConfig) => {
      chainConfig.contracts.forEach((contract) => {
        if (contract.bridgeType !== BridgeType.LOOP) {
          check(this.config['bridges'][contract.bridgeType], `no bridge ${contract.bridgeType} config`);
          check(this.config['chains'][contract.peerChainId], 'non-exist peerChainId');
          const peerChain = this.config['chains'][contract.peerChainId];
          check(peerChain.getContract(contract.peerContractAddress), 'non-exist peerChainContract');
          const peerContract = peerChain.getContract(contract.peerContractAddress);
          check(peerContract.bridgeType === contract.bridgeType, 'bridge type does not match');
          check(peerContract.assetDecimals === contract.assetDecimals, 'token decimals does not match');
          check(peerContract.peerChainId === chainConfig.chainId, 'chain id does not match');
          check(peerContract.peerContractAddress === contract.address, 'contract address does not match');
        }
        check(
          this.getCircuitConfig(contract.circuits),
          `circuits version ${contract.circuits} is not configured`,
        );
      });
    });
  }
}

export async function readFromFile(configFile) {
  check(typeof configFile === 'string', 'configFile should be string');
  const rawConfig = await readJsonFile(configFile);
  return new MystikoConfig(rawConfig);
}
