import { PolyBridgeConfig, RawConfig, RawPolyBridgeConfig } from '../../../src';

let rawConfig: RawPolyBridgeConfig;
let config: PolyBridgeConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawPolyBridgeConfig, 'tests/files/bridge/poly.valid.json');
  config = new PolyBridgeConfig(rawConfig);
});

test('test equality', () => {
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
  expect(config.explorerUrl).toBe(rawConfig.explorerUrl);
  expect(config.explorerPrefix).toBe(rawConfig.explorerPrefix);
  expect(config.apiUrl).toBe(rawConfig.apiUrl);
  expect(config.apiPrefix).toBe(rawConfig.apiPrefix);
});

test('test copy', () => {
  expect(new PolyBridgeConfig(config.copyData())).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.name = 'another name';
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawPolyBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
