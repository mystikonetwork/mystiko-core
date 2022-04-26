import { BridgeType, EXPLORER_DEFAULT_PREFIX, RawConfig, RawPolyBridgeConfig } from '../../../src';

let config: RawPolyBridgeConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawPolyBridgeConfig, {
    name: 'Poly Bridge',
    explorerUrl: 'https://explorer.poly.network',
    explorerPrefix: '/tx/%tx%',
    apiUrl: 'https://explorer.poly.network',
    apiPrefix: '/testnet/api/v1/getcrosstx?txhash=%tx%',
  });
});

test('test validate success', () => {
  expect(config.type).toBe(BridgeType.POLY);
  expect(config.explorerPrefix).toBe(EXPLORER_DEFAULT_PREFIX);
});

test('test invalid type', async () => {
  config.type = BridgeType.TBRIDGE;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid explorerUrl', async () => {
  config.explorerUrl = '';
  await expect(config.validate()).rejects.toThrow();
  config.explorerUrl = 'wrong url';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid explorerPrefix', async () => {
  config.explorerUrl = '';
  await expect(config.validate()).rejects.toThrow();
  config.explorerUrl = 'wrong prefix';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid apiUrl', async () => {
  config.apiUrl = '';
  await expect(config.validate()).rejects.toThrow();
  config.apiUrl = 'wrong url';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid apiPrefix', async () => {
  config.apiPrefix = '';
  await expect(config.validate()).rejects.toThrow();
  config.apiPrefix = 'wrong prefix';
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawPolyBridgeConfig,
    'tests/files/bridge/poly.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawPolyBridgeConfig, 'tests/files/bridge/poly.invalid.json'),
  ).rejects.toThrow();
});
