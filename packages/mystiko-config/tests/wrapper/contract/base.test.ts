import { ContractConfig, RawConfig, RawContractConfig } from '../../../src';

let rawConfig: RawContractConfig;
let config: ContractConfig<RawContractConfig>;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawContractConfig, 'tests/files/contract/base.valid.json');
  config = new ContractConfig<RawContractConfig>(rawConfig);
});

test('test equality', () => {
  expect(config.version).toBe(rawConfig.version);
  expect(config.address).toBe(rawConfig.address);
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
  expect(config.startBlock).toBe(rawConfig.startBlock);
  expect(config.eventFilterSize).toBe(rawConfig.eventFilterSize);
});

test('test copy', () => {
  expect(new ContractConfig<RawContractConfig>(config.copyData())).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  expect(config.mutate(undefined, {}).copyData()).toStrictEqual(rawConfig);
  rawConfig.name = 'another name';
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
