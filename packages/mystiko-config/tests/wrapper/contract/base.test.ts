import { ContractConfig, RawContractConfig, readRawConfigFromObject } from '../../../src';

let rawConfig: RawContractConfig;
let config: ContractConfig<RawContractConfig>;

beforeEach(async () => {
  rawConfig = await readRawConfigFromObject(RawContractConfig, 'tests/files/contract/base.valid.json');
  config = new ContractConfig<RawContractConfig>(rawConfig);
});

test('test equality', () => {
  expect(config.version).toBe(rawConfig.version);
  expect(config.address).toBe(rawConfig.address);
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
  expect(config.startBlock).toBe(rawConfig.eventFilterSize);
  expect(config.eventFilterSize).toBe(rawConfig.eventFilterSize);
});

test('test copy', () => {
  expect(new ContractConfig<RawContractConfig>(config.copyData())).toStrictEqual(config);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await readRawConfigFromObject(RawContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
