import { validate } from 'class-validator';
import { RawBridgeConfig, BridgeType, readRawConfigFromFile } from '../../../src';

let config: RawBridgeConfig;

beforeEach(() => {
  config = new RawBridgeConfig();
  config.name = 'Mystiko Testnet Bridge';
  config.type = BridgeType.TBRIDGE;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid name', async () => {
  config.name = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawBridgeConfig, 'tests/files/bridge/base.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawBridgeConfig, 'tests/files/bridge/base.invalid.json'),
  ).rejects.toThrow();
});
