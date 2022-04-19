import {
  RawTBridgeConfig,
  readRawConfigFromFile,
  readRawConfigFromObject,
  TBridgeConfig,
} from '../../../src';

let rawConfig: RawTBridgeConfig;
let config: TBridgeConfig;

beforeEach(async () => {
  rawConfig = await readRawConfigFromFile(RawTBridgeConfig, 'tests/files/bridge/tbridge.valid.json');
  config = new TBridgeConfig(rawConfig);
});

test('test equality', () => {
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
});

test('test copy', () => {
  expect(new TBridgeConfig(config.copyData())).toStrictEqual(config);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await readRawConfigFromObject(RawTBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
