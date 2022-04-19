import { validate } from 'class-validator';
import { RawProviderConfig, readRawConfigFromFile } from '../../src';

let config: RawProviderConfig;

beforeEach(() => {
  config = new RawProviderConfig();
  config.url = 'http://localhost:8545';
  config.timeoutMs = 100000;
  config.maxTryCount = 5;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid url', async () => {
  config.url = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.url = 'not even a url';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.url = 'wrong_schema://localhost:8545';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid timeoutMs', async () => {
  config.timeoutMs = -1;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.timeoutMs = 1.33;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid maxTryCount', async () => {
  config.maxTryCount = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.timeoutMs = 2.4;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawProviderConfig, 'tests/files/provider.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawProviderConfig, 'tests/files/provider.invalid.json'),
  ).rejects.toThrow();
});
