import { ProviderConfig, RawConfig, RawProviderConfig } from '../../src';

let rawConfig: RawProviderConfig;
let config: ProviderConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawProviderConfig, 'tests/files/provider.valid.json');
  config = new ProviderConfig(rawConfig);
});

test('test equality', () => {
  expect(config.url).toBe(rawConfig.url);
  expect(config.timeoutMs).toBe(rawConfig.timeoutMs);
  expect(config.maxTryCount).toBe(rawConfig.maxTryCount);
});

test('test copy', () => {
  expect(new ProviderConfig(config.copyData())).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.maxTryCount = 10;
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.maxTryCount).toBe(10);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawProviderConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
