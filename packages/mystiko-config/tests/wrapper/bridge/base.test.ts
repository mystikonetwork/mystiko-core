import { BridgeConfig, RawBridgeConfig, readRawConfigFromFile, readRawConfigFromObject } from '../../../src';

let rawConfig: RawBridgeConfig;
let config: BridgeConfig<RawBridgeConfig>;

beforeEach(async () => {
  rawConfig = await readRawConfigFromFile(RawBridgeConfig, 'tests/files/bridge/base.valid.json');
  config = new BridgeConfig<RawBridgeConfig>(rawConfig);
});

test('test equality', () => {
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
});

test('test copy', () => {
  expect(new BridgeConfig<RawBridgeConfig>(config.copyData())).toStrictEqual(config);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await readRawConfigFromObject(RawBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
