import { BridgeType, RawCelerBridgeConfig, RawConfig } from '../../../src';

let config: RawCelerBridgeConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawCelerBridgeConfig, { name: 'Celer Bridge' });
});

test('test invalid type', async () => {
  config.type = BridgeType.TBRIDGE;
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawCelerBridgeConfig,
    'tests/files/bridge/celer.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawCelerBridgeConfig, 'tests/files/bridge/celer.invalid.json'),
  ).rejects.toThrow();
});
