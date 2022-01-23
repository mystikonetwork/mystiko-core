import { BaseConfig } from './common.js';
import { BridgeType, isValidBridgeType } from '../model';
import { ChainConfig } from './chainConfig.js';
import { check, readJsonFile } from '../utils.js';
import { BaseBridgeConfig } from './bridgeConfig.js';
import { CircuitConfig } from './circuitConfig.js';

/**
 * @class MystikoConfig
 * @extends BaseConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for this library.
 */
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

  /**
   * @property {string} version
   * @desc version of current configuration.
   */
  get version() {
    return this.config['version'];
  }

  /**
   * @property {ChainConfig[]} chains
   * @desc an array of current configured blockchain networks.
   */
  get chains() {
    return Object.values(this.config['chains']);
  }

  /**
   * @property {CircuitConfig[]} circuits
   * @desc an array of configured zero knowledge proof related resources.
   */
  get circuits() {
    return Object.values(this.config['circuits']);
  }

  /**
   * @desc get the configuration of blockchain with given chainId.
   * @param {number} chainId blockchain's chainId @see {@link https://chainlist.org/ ChainList}.
   * @returns {ChainConfig} the config object of given blockchain. It returns undefined,
   * if given chainId is not configured.
   */
  getChainConfig(chainId) {
    check(typeof chainId === 'number' || chainId instanceof Number, 'chainId should be number or Number');
    return this.config['chains'][chainId];
  }

  /**
   * @desc get the supported peer chain configurations of the given chainId.
   * @param {number} chainId blockchain's chainId @see {@link https://chainlist.org/ ChainList}.
   * @returns {ChainConfig[]} an array of peer chain's configurations. It returns an empty array,
   * if no peer chains are configured for given chainId.
   */
  getPeerChains(chainId) {
    const chainConfig = this.getChainConfig(chainId);
    if (chainConfig) {
      return chainConfig.peerChainIds.map((peerChainId) => this.getChainConfig(peerChainId));
    }
    return [];
  }

  /**
   * @desc get the array of supported asset symbols with given source chain id and destination chain id.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @returns {string[]} an array of supported asset symbols. It returns an empty array,
   * if no configured asset symbols are found for given srcChainId and dstChainId.
   */
  getAssetSymbols(srcChainId, dstChainId) {
    const chainConfig = this.getChainConfig(srcChainId);
    if (chainConfig) {
      return chainConfig.getAssetSymbols(dstChainId);
    }
    return [];
  }

  /**
   * @desc get the array of supported cross-chain bridges with given source chain id, destination chain id and
   * the symbol of asset.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @returns {BridgeType[]} an array of supported cross-chain bridges. It returns an empty array,
   * if no configured cross-chain bridges are found for given srcChainId, dstChainId and assetSymbol.
   * If srcChainId === dstChainId, it returns an empty array, because in this situation, it does not need a
   * cross-chain bridge.
   */
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

  /**
   * @desc get the configuration of given cross-chain bridge.
   * @param {module:mystiko/models.BridgeType} bridgeType the type of cross-chain bridge.
   * @returns {BaseBridgeConfig} configuration of the specified cross-chain bridge.
   */
  getBridgeConfig(bridgeType) {
    check(typeof bridgeType === 'string', 'bridgeType should be string');
    check(isValidBridgeType(bridgeType), 'invalid bridge type');
    return this.config['bridges'][bridgeType];
  }

  /**
   * @desc get the configuration of the given combination of source chain id, destination chain id,
   * asset symbol and cross-chain bridge. This method is useful for detecting the contract for the given
   * user inputs.
   * @param {number} srcChainId chain id of the source blockchain(from chain).
   * @param {number} dstChainId chain id of the destination blockchain(to chain).
   * @param {string} assetSymbol symbol of the asset. E.g. ETH/USDT/BNB
   * @param {module:mystiko/models.BridgeType} bridge the type of cross-chain bridge.
   * @returns {ContractConfig} the found configuration of the contract.
   * @throws {Error} if no configured contracts satisfy the given inputs.
   */
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

  /**
   * @desc get the configuration of zero knowledge proof resources with given scheme name.
   * @param {string} name name of supported zkp scheme.
   * @returns {CircuitConfig} configuration of zkp scheme.
   */
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

/**
 * @function module:mystiko/config.readFromFile
 * @param {string} configFile file name of the configuration. It could be a URL or file system's path.
 * @returns {Promise<MystikoConfig>}
 */
export async function readFromFile(configFile) {
  check(typeof configFile === 'string', 'configFile should be string');
  const rawConfig = await readJsonFile(configFile);
  return new MystikoConfig(rawConfig);
}
