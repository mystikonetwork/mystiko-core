import { RawBridgeConfig, BridgeType, RawConfig } from '../../../src';

let config: RawBridgeConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawBridgeConfig, {
    name: 'Mystiko Testnet Bridge',
    type: BridgeType.TBRIDGE,
  });
});

test('test invalid name', async () => {
  config.name = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(RawBridgeConfig, 'tests/files/bridge/base.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawBridgeConfig, 'tests/files/bridge/base.invalid.json'),
  ).rejects.toThrow();
});
