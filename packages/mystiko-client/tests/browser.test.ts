/**
 * @jest-environment jsdom
 */
import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystiko/config';
import mystiko from '../src/browser';

test('test window is set', async () => {
  await mystiko.initialize({ dbAdapter: undefined });
  expect(mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await mystiko.initialize({ isTestnet: true, dbAdapter: undefined });
  expect(mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await mystiko.initialize({ isTestnet: false, dbAdapter: undefined });
  expect(mystiko.config).toStrictEqual(DefaultClientMainnetConfig);
});
