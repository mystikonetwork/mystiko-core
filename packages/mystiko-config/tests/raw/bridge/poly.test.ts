import { validate } from 'class-validator';
import {
  BridgeType,
  EXPLORER_DEFAULT_PREFIX,
  RawPolyBridgeConfig,
  readRawConfigFromFile,
} from '../../../src';

let config: RawPolyBridgeConfig;

beforeEach(() => {
  config = new RawPolyBridgeConfig();
  config.name = 'Poly Bridge';
  config.explorerUrl = 'https://explorer.poly.network';
  config.apiUrl = 'https://explorer.poly.network';
  config.apiPrefix = '/testnet/api/v1/getcrosstx?txhash=%tx%';
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  expect(config.type).toBe(BridgeType.POLY);
  expect(config.explorerPrefix).toBe(EXPLORER_DEFAULT_PREFIX);
});

test('test invalid type', async () => {
  config.type = BridgeType.TBRIDGE;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid explorerUrl', async () => {
  config.explorerUrl = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.explorerUrl = 'wrong url';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid explorerPrefix', async () => {
  config.explorerUrl = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.explorerUrl = 'wrong prefix';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid apiUrl', async () => {
  config.apiUrl = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.apiUrl = 'wrong url';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid apiPrefix', async () => {
  config.apiPrefix = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.apiPrefix = 'wrong prefix';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawPolyBridgeConfig, 'tests/files/bridge/poly.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawPolyBridgeConfig, 'tests/files/bridge/poly.invalid.json'),
  ).rejects.toThrow();
});
