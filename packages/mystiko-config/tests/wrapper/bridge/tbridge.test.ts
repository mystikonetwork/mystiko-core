import { RawConfig, RawTBridgeConfig, TBridgeConfig } from '../../../src';

let rawConfig: RawTBridgeConfig;
let config: TBridgeConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawTBridgeConfig, 'tests/files/bridge/tbridge.valid.json');
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
  const loadedRawConfig = await RawConfig.createFromObject(RawTBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
