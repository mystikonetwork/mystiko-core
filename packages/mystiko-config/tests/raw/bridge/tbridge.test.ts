import { validate } from 'class-validator';
import { BridgeType, readRawConfigFromFile, RawTBridgeConfig } from '../../../src';

let config: RawTBridgeConfig;

beforeEach(() => {
  config = new RawTBridgeConfig();
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
  const fileConfig = await readRawConfigFromFile(RawTBridgeConfig, 'tests/files/bridge/tbridge.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawTBridgeConfig, 'tests/files/bridge/tbridge.invalid.json'),
  ).rejects.toThrow();
});
