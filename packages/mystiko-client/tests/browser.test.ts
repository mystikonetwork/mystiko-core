/**
 * @jest-environment jsdom
 */
import { ethers } from 'ethers';
import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystiko/config';
import { ProviderFactory } from '@mystiko/utils';
import mystiko from '../src/browser';

test('test window is set', async () => {
  const providerFactory: ProviderFactory = {
    createProvider: (connections) => new ethers.providers.JsonRpcProvider(connections[0]),
  };
  await mystiko.initialize({ dbAdapter: undefined, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await mystiko.initialize({ isTestnet: true, dbAdapter: undefined, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultClientTestnetConfig);
  await mystiko.initialize({ isTestnet: false, dbAdapter: undefined, providerFactory });
  expect(mystiko.config).toStrictEqual(DefaultClientMainnetConfig);
});
