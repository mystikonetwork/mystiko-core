import { BaseConfig } from './common.js';
import { check } from '../utils.js';
import { MystikoABI } from '../chain/abi.js';

/**
 * @typedef BridgeType
 * @property {string} LOOP a loop bridge indicates no cross-chain needed.
 * The deposits and withdraws happens on the same blockchain.
 * @property {string} POLY the {@link https://poly.network Poly Bridge} cross-chain network.
 */
export const BridgeType = {
  LOOP: 'loop',
  POLY: 'poly',
};

/**
 * @typedef AssetType
 * @property {string} ERC20 the {@link https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ ERC20 Token}
 * standard.
 * @property {string} MAIN main asset type of the blockchains, e.g. ETH/BNB
 */
export const AssetType = {
  ERC20: 'erc20',
  MAIN: 'main',
};

const AbiIndex = {
  [AssetType.ERC20]: {
    [BridgeType.LOOP]: MystikoABI.MystikoWithLoopERC20,
    [BridgeType.POLY]: MystikoABI.MystikoWithPolyERC20,
  },
  [AssetType.MAIN]: {
    [BridgeType.LOOP]: MystikoABI.MystikoWithLoopMain,
    [BridgeType.POLY]: MystikoABI.MystikoWithPolyMain,
  },
};

/**
 * @memberOf module:mystiko/config
 * @desc check whether given type is one of the supported bridge types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidBridgeType(type) {
  return Object.values(BridgeType).indexOf(type) !== -1;
}

/**
 * @memberOf module:mystiko/config
 * @desc check whether given type is one of the supported asset types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidAssetType(type) {
  return Object.values(AssetType).indexOf(type) !== -1;
}

/**
 * @class ContractConfig
 * @extends BaseConfig
 * @desc configuration class of the deployed smart contracts of the Mystiko core protocol.
 */
export class ContractConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkEthAddress(this.config, 'address');
    BaseConfig.checkString(this.config, 'assetSymbol');
    BaseConfig.checkNumber(this.config, 'assetDecimals');
    BaseConfig.checkString(this.config, 'assetType');
    check(isValidAssetType(this.assetType), this.assetType + ' is invalid asset type');
    if (this.assetType !== AssetType.MAIN) {
      BaseConfig.checkEthAddress(this.config, 'assetAddress');
    }
    BaseConfig.checkString(this.config, 'bridgeType');
    check(isValidBridgeType(this.bridgeType), this.bridgeType + ' is invalid bridge type');
    if (this.bridgeType !== BridgeType.LOOP) {
      BaseConfig.checkNumber(this.config, 'peerChainId');
      BaseConfig.checkEthAddress(this.config, 'peerContractAddress');
    }
    BaseConfig.checkString(this.config, 'circuits');
  }

  /**
   * @property {string} address
   * @desc the address of this configured smart contract.
   */
  get address() {
    return this.config['address'];
  }

  /**
   * @property {BridgeType} bridgeType
   * @desc the supported cross-chain bridge type of this configured smart contract.
   */
  get bridgeType() {
    return this.config['bridgeType'];
  }

  /**
   * @property {string} assetAddress
   * @desc the address of the supported asset in this configured smart contract.
   */
  get assetAddress() {
    return this.config['assetAddress'];
  }

  /**
   * @property {AssetType} assetType
   * @desc the type of the supported asset in this configured smart contract.
   */
  get assetType() {
    return this.config['assetType'];
  }

  /**
   * @property {string} assetSymbol
   * @desc the symbol of the supported asset in this configured smart contract.
   */
  get assetSymbol() {
    return this.config['assetSymbol'];
  }

  /**
   * @property {number} assetDecimals
   * @desc the number of precision bits of the supported asset in this configured smart contract.
   */
  get assetDecimals() {
    return this.config['assetDecimals'];
  }

  /**
   * @property {Object} abi
   * @desc the compiled ABI encoding information of this configured smart contract.
   */
  get abi() {
    return AbiIndex[this.assetType][this.bridgeType];
  }

  /**
   * @property {number} peerChainId
   * @desc the peer chain id of this configured smart contract.
   * It is undefined if the bridge type is loop.
   */
  get peerChainId() {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.config['peerChainId'];
    }
    return undefined;
  }

  /**
   * @property {string} peerContractAddress
   * @desc the peer chain smart contract address of this configured smart contract.
   * It is undefined if the bridge type is loop.
   */
  get peerContractAddress() {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.config['peerContractAddress'];
    }
    return undefined;
  }

  /**
   * @property {string} circuits
   * @desc the scheme name of zkp circuits of this configured smart contract.
   */
  get circuits() {
    return this.config['circuits'];
  }
}
