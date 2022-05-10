import { ethers } from 'ethers';
import { MystikoConfig } from '@mystikonetwork/config';
import { ProviderConnection } from '@mystikonetwork/utils';
import { ProviderPoolImpl } from '../../src';

let config: MystikoConfig;

beforeEach(async () => {
  config = await MystikoConfig.createFromPlain({
    version: '0.1.0',
    chains: [
      {
        chainId: 3,
        name: 'Ethereum Ropsten',
        assetSymbol: 'ETH',
        explorerUrl: 'https://ropsten.etherscan.io',
        signerEndpoint: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          { url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-ropsten.alchemyapi.io/v2/kf1OjEJTu_kWaRHNIHLqRNDUeP4rV3j5' },
        ],
      },
      {
        chainId: 5,
        name: 'Ethereum Goerli',
        assetSymbol: 'ETH',
        explorerUrl: 'https://goerli.etherscan.io',
        signerEndpoint: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        providers: [
          { url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' },
          { url: 'https://eth-goerli.alchemyapi.io/v2/X0WmNwQWIjARyvQ2io1aZk0F3IjJ2qcM' },
        ],
      },
    ],
  });
});

test('test checkProvider', async () => {
  const providerPool = new ProviderPoolImpl(config);
  await expect(providerPool.checkProvider(300)).rejects.toThrow(
    new Error('cannot get provider for chainId=300'),
  );
  expect(await providerPool.checkProvider(3)).not.toBe(undefined);
});

test('test getProvider', async () => {
  const providerPool = new ProviderPoolImpl(config);
  expect(await providerPool.getProvider(300)).toBe(undefined);
  expect(await providerPool.getProvider(3)).not.toBe(undefined);
  expect(await providerPool.getProvider(5)).not.toBe(undefined);
});

test('test setProvider', async () => {
  const providerPool = new ProviderPoolImpl(config);
  const newProvider = new ethers.providers.JsonRpcProvider(
    'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  );
  providerPool.setProvider(3, newProvider);
  expect(await providerPool.getProvider(3)).toStrictEqual(newProvider);
});

test('test different providerFactory', async () => {
  const providerPool = new ProviderPoolImpl(config, undefined, {
    createProvider(connections: Array<string | ProviderConnection>): ethers.providers.BaseProvider {
      const urls = connections.map((conn) => (typeof conn === 'string' ? conn : conn.url));
      return new ethers.providers.JsonRpcProvider(urls[0]);
    },
  });
  expect((await providerPool.getProvider(3)) instanceof ethers.providers.JsonRpcProvider).toBe(true);
});

test('test setProviderFactory', async () => {
  const providerPool = new ProviderPoolImpl(config);
  providerPool.setProviderFactory({
    createProvider(connections: Array<string | ProviderConnection>): ethers.providers.BaseProvider {
      const urls = connections.map((conn) => (typeof conn === 'string' ? conn : conn.url));
      return new ethers.providers.JsonRpcProvider(urls[0]);
    },
  });
  expect((await providerPool.getProvider(3)) instanceof ethers.providers.JsonRpcProvider).toBe(true);
});

test('test providerConfigGetter', async () => {
  const providerPool = new ProviderPoolImpl(
    config,
    (chainId) => {
      if (chainId === 3) {
        return Promise.resolve([{ url: 'http://localhost:8080' }]);
      }
      return Promise.resolve([]);
    },
    {
      createProvider(connections: Array<string | ProviderConnection>): ethers.providers.BaseProvider {
        const urls = connections.map((conn) => (typeof conn === 'string' ? conn : conn.url));
        return new ethers.providers.JsonRpcProvider(urls[0]);
      },
    },
  );
  const provider = await providerPool.getProvider(3);
  expect((provider as ethers.providers.JsonRpcProvider).connection.url).toBe('http://localhost:8080');
  expect(providerPool.hasProvider(3)).toBe(true);
  expect(await providerPool.getProvider(5)).toBe(undefined);
  expect(providerPool.hasProvider(5)).toBe(false);
});

test('test clearProvider/hasProvider', async () => {
  const providerPool = new ProviderPoolImpl(config);
  expect(await providerPool.getProvider(3)).not.toBe(undefined);
  expect(providerPool.hasProvider(3)).toBe(true);
  providerPool.clearProvider(3);
  providerPool.clearProvider(300);
  expect(providerPool.hasProvider(3)).toBe(false);
});
