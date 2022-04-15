import { validate } from 'class-validator';
import { BridgeType, CelerBridgeConfig, readConfigFromFile } from '../../src';

let config: CelerBridgeConfig;

beforeEach(() => {
  config = new CelerBridgeConfig();
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
  const fileConfig = await readConfigFromFile(CelerBridgeConfig, 'tests/files/bridge/celer.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readConfigFromFile(CelerBridgeConfig, 'tests/files/bridge/celer.invalid.json'),
  ).rejects.toThrow();
});
