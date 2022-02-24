import { DefaultClientTestnetConfig, DefaultClientMainnetConfig, DefaultClientConfigJson } from '../src';

test('test default objects', () => {
  expect(DefaultClientTestnetConfig).not.toBe(undefined);
  expect(DefaultClientMainnetConfig).not.toBe(undefined);
  expect(DefaultClientConfigJson.testnet).not.toBe(undefined);
  expect(DefaultClientConfigJson.mainnet).not.toBe(undefined);
});
