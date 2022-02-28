import { ethers } from 'ethers';
import { readFromFile } from '@mystiko/config';
import { ProviderPool } from '../../src';

test('test connect', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  const pool = new ProviderPool(conf);
  pool.connect();
  expect(pool.getProvider(1)).not.toBe(undefined);
  expect(pool.getProvider(56)).not.toBe(undefined);
  expect(pool.getProvider(12)).toBe(undefined);
  pool.connect((rpcEndpoints) => new ethers.providers.JsonRpcProvider(rpcEndpoints[0]));
  expect(pool.getProvider(1)).not.toBe(undefined);
  expect(pool.getProvider(56)).not.toBe(undefined);
});

test('test connect websocket', async () => {
  const conf = await readFromFile('tests/chain/files/config.provider.test.json');
  const pool = new ProviderPool(conf);
  pool.connect();
  expect(pool.getProvider(1) instanceof ethers.providers.JsonRpcProvider).toBe(true);
  expect(pool.getProvider(2) instanceof ethers.providers.JsonRpcProvider).toBe(true);
  expect(pool.getProvider(3) instanceof ethers.providers.FallbackProvider).toBe(true);
});
