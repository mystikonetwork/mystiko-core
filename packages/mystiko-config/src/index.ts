import DefaultClientTestnetJson from '../config/client/default/testnet.json';
import DefaultClientMainnetJson from '../config/client/default/mainnet.json';
import { MystikoConfig } from './mystiko';

export const DefaultClientTestnetConfig = new MystikoConfig(DefaultClientTestnetJson);
export const DefaultClientMainnetConfig = new MystikoConfig(DefaultClientMainnetJson);
export const DefaultClientConfigJson = {
  testnet: DefaultClientTestnetJson,
  mainnet: DefaultClientMainnetJson,
};

export * from './abi';
export * from './base';
export * from './bridge';
export * from './chain';
export * from './circuit';
export * from './contract';
export * from './mystiko';
