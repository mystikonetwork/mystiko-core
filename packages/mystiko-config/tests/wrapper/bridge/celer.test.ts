import {
  CelerBridgeConfig,
  RawCelerBridgeConfig,
  readRawConfigFromFile,
  readRawConfigFromObject,
} from '../../../src';

let rawConfig: RawCelerBridgeConfig;
let config: CelerBridgeConfig;

beforeEach(async () => {
  rawConfig = await readRawConfigFromFile(RawCelerBridgeConfig, 'tests/files/bridge/celer.valid.json');
  config = new CelerBridgeConfig(rawConfig);
});

test('test equality', () => {
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
});

test('test copy', () => {
  expect(new CelerBridgeConfig(config.copyData())).toStrictEqual(config);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await readRawConfigFromObject(RawCelerBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
