import { CelerBridgeConfig, RawCelerBridgeConfig, RawConfig } from '../../../src';

let rawConfig: RawCelerBridgeConfig;
let config: CelerBridgeConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawCelerBridgeConfig, 'tests/files/bridge/celer.valid.json');
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
  const loadedRawConfig = await RawConfig.createFromObject(RawCelerBridgeConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
