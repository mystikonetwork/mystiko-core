import { ProviderPool } from '../../src/chain/provider.js';
import { readFromFile } from '../../src/config';

test('test connect', async () => {
  expect(() => new ProviderPool({})).toThrow();
  const conf = await readFromFile('tests/config/files/config.test.json');
  const pool = new ProviderPool(conf);
  pool.connect();
  expect(pool.getProvider(1)).not.toBe(undefined);
  expect(pool.getProvider(56)).not.toBe(undefined);
  expect(() => pool.getProvider('1')).toThrow();
  expect(() => pool.getProvider(12)).toThrow();
  pool.connect((rpcEndpoints) => JSON.stringify(rpcEndpoints));
  expect(pool.getProvider(1)).not.toBe(undefined);
  expect(pool.getProvider(56)).not.toBe(undefined);
});