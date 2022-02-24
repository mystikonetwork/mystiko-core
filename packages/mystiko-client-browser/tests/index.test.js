import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystiko/config';
import '../src/index.js';

test('test window is set', async () => {
  expect(window.mystiko).not.toBe(undefined);
  await window.mystiko.initialize({ dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await window.mystiko.initialize({ isTestnet: true, dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await window.mystiko.initialize({ isTestnet: false, dbAdapter: undefined });
  expect(window.mystiko.config).toStrictEqual(DefaultClientMainnetConfig);
});
