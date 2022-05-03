import { BaseConfig, RawConfig } from '../../src';

test('test mutate', () => {
  const rawConfig = new RawConfig();
  const config = new BaseConfig<RawConfig>(rawConfig, {});
  expect(config.mutate()).toStrictEqual(config);
  expect(config.mutate(rawConfig, {})).toStrictEqual(config);
});
