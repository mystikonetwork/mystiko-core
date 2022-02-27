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
