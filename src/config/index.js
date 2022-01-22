import { MystikoConfig } from './mystikoConfig';
import DefaultTestnetConfigJson from './default/testnet.json';
import DefaultMainnetConfigJson from './default/mainnet.json';

/**
 * @module module:mystiko/config
 * @desc a collection of function for handling configuration related resources.
 */
export { BaseConfig } from './common.js';
export {
  ContractConfig,
  AssetType,
  BridgeType,
  isValidAssetType,
  isValidBridgeType,
} from './contractConfig.js';
export { ChainConfig } from './chainConfig.js';
export { MystikoConfig, readFromFile } from './mystikoConfig';

export const DefaultTestnetConfig = new MystikoConfig(DefaultTestnetConfigJson);
export const DefaultMainnetConfig = new MystikoConfig(DefaultMainnetConfigJson);
