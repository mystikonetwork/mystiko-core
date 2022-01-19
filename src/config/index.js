import { BaseConfig } from './common.js';
import {
  ContractConfig,
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
} from './contractConfig.js';
import { ChainConfig } from './chainConfig.js';
import { MystikoConfig, readFromFile } from './mystikoConfig';

export default {
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
  BaseConfig,
  ContractConfig,
  ChainConfig,
  MystikoConfig,
  readFromFile,
};
