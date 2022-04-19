import {
  PolyBridgeConfig,
  RawPolyBridgeConfig,
  readRawConfigFromFile,
  readRawConfigFromObject,
} from '../../../src';

let rawConfig: RawPolyBridgeConfig;
let config: PolyBridgeConfig;

beforeEach(async () => {
  rawConfig = await readRawConfigFromFile(RawPolyBridgeConfig, 'tests/files/bridge/poly.valid.json');
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

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await readRawConfigFromObject(RawPolyBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
