import { BaseConfig } from './common.js';
import { check } from '../utils.js';
import { MystikoABI } from '../chain/abi.js';

export const BridgeType = {
  LOOP: 'loop',
  POLY: 'poly',
};

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

export function isValidBridgeType(type) {
  return Object.values(BridgeType).indexOf(type) !== -1;
}

export function isValidAssetType(type) {
  return Object.values(AssetType).indexOf(type) !== -1;
}

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
    BaseConfig.checkString(this.config, 'wasmFile');
    BaseConfig.checkString(this.config, 'zkeyFile');
    BaseConfig.checkString(this.config, 'vkeyFile');
  }

  get address() {
    return this.config['address'];
  }

  get bridgeType() {
    return this.config['bridgeType'];
  }

  get assetAddress() {
    return this.config['assetAddress'];
  }

  get assetType() {
    return this.config['assetType'];
  }

  get assetSymbol() {
    return this.config['assetSymbol'];
  }

  get assetDecimals() {
    return this.config['assetDecimals'];
  }

  get abi() {
    return AbiIndex[this.assetType][this.bridgeType];
  }

  get wasmFile() {
    return this.config['wasmFile'];
  }

  get zkeyFile() {
    return this.config['zkeyFile'];
  }

  get vkeyFile() {
    return this.config['vkeyFile'];
  }

  get peerChainId() {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.config['peerChainId'];
    }
    return undefined;
  }

  get peerContractAddress() {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.config['peerContractAddress'];
    }
    return undefined;
  }
}
