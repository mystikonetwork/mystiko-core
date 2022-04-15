import { validate } from 'class-validator';
import { BridgeType, readConfigFromFile, TBridgeConfig } from '../../src';

let config: TBridgeConfig;

beforeEach(() => {
  config = new TBridgeConfig();
  config.name = 'Mystiko Testnet Bridge';
  config.type = BridgeType.TBRIDGE;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  expect(config.type).toBe(BridgeType.TBRIDGE);
});

test('test invalid type', async () => {
  config.type = BridgeType.POLY;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readConfigFromFile(TBridgeConfig, 'tests/files/bridge/tbridge.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readConfigFromFile(TBridgeConfig, 'tests/files/bridge/tbridge.invalid.json'),
  ).rejects.toThrow();
});
