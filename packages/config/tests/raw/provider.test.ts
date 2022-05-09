import { RawConfig, RawProviderConfig } from '../../src';

let config: RawProviderConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawProviderConfig, {
    url: 'http://localhost:8545',
    timeoutMs: 100000,
    maxTryCount: 5,
  });
});

test('test invalid url', async () => {
  config.url = '';
  await expect(config.validate()).rejects.toThrow();
  config.url = 'not even a url';
  await expect(config.validate()).rejects.toThrow();
  config.url = 'wrong_schema://localhost:8545';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid timeoutMs', async () => {
  config.timeoutMs = -1;
  await expect(config.validate()).rejects.toThrow();
  config.timeoutMs = 1.33;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid maxTryCount', async () => {
  config.maxTryCount = 0;
  await expect(config.validate()).rejects.toThrow();
  config.timeoutMs = 2.4;
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(RawProviderConfig, 'tests/files/provider.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawProviderConfig, 'tests/files/provider.invalid.json'),
  ).rejects.toThrow();
});
