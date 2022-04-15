import { validate } from 'class-validator';
import { BridgeType, RawCelerBridgeConfig, readRawConfigFromFile } from '../../../src';

let config: RawCelerBridgeConfig;

beforeEach(() => {
  config = new RawCelerBridgeConfig();
  config.name = 'Celer Bridge';
  config.type = BridgeType.CELER;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  expect(config.type).toBe(BridgeType.CELER);
});

test('test invalid type', async () => {
  config.type = BridgeType.TBRIDGE;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawCelerBridgeConfig, 'tests/files/bridge/celer.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawCelerBridgeConfig, 'tests/files/bridge/celer.invalid.json'),
  ).rejects.toThrow();
});
