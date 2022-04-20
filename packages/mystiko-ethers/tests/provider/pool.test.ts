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

test('test connect', () => {
  const providerPool = new ProviderPoolImpl(config);
  providerPool.connect();
  expect(providerPool.getProvider(3)).not.toBe(undefined);
  expect(providerPool.getProvider(5)).not.toBe(undefined);
});

test('test setProvider', () => {
  const providerPool = new ProviderPoolImpl(config);
  providerPool.connect();
  const newProvider = new ethers.providers.JsonRpcProvider(
    'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  );
  providerPool.setProvider(3, newProvider);
  expect(providerPool.getProvider(3)).toStrictEqual(newProvider);
});

test('test different providerFactory', () => {
  const providerPool = new ProviderPoolImpl(config, {
    createProvider(connections: Array<string | ProviderConnection>): ethers.providers.BaseProvider {
      const urls = connections.map((conn) => (typeof conn === 'string' ? conn : conn.url));
      return new ethers.providers.JsonRpcProvider(urls[0]);
    },
  });
  providerPool.connect();
  expect(providerPool.getProvider(3) instanceof ethers.providers.JsonRpcProvider).toBe(true);
});

test('test setProviderFactory', () => {
  const providerPool = new ProviderPoolImpl(config);
  providerPool.setProviderFactory({
    createProvider(connections: Array<string | ProviderConnection>): ethers.providers.BaseProvider {
      const urls = connections.map((conn) => (typeof conn === 'string' ? conn : conn.url));
      return new ethers.providers.JsonRpcProvider(urls[0]);
    },
  });
  providerPool.connect();
  expect(providerPool.getProvider(3) instanceof ethers.providers.JsonRpcProvider).toBe(true);
});
