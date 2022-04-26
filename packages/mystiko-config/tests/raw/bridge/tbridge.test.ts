import { BridgeType, RawConfig, RawTBridgeConfig } from '../../../src';

let config: RawTBridgeConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawTBridgeConfig, {
    name: 'Mystiko Testnet Bridge',
  });
});

test('test validate success', () => {
  expect(config.type).toBe(BridgeType.TBRIDGE);
});

test('test invalid type', async () => {
  config.type = BridgeType.POLY;
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawTBridgeConfig,
    'tests/files/bridge/tbridge.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawTBridgeConfig, 'tests/files/bridge/tbridge.invalid.json'),
  ).rejects.toThrow();
});
