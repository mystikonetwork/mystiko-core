import { Wallet } from '../../src';

test('Test Wallet getters/setters', () => {
  const wallet = new Wallet();
  expect(wallet.id).toBe(undefined);
  expect(wallet.encryptedMasterSeed).toBe(undefined);
  expect(wallet.hashedPassword).toBe(undefined);
  expect(wallet.accountNonce).toBe(undefined);
  expect(wallet.version).toBe(undefined);
  wallet.encryptedMasterSeed = '6b1e3166';
  expect(wallet.encryptedMasterSeed).toBe('6b1e3166');
  wallet.hashedPassword = '702434';
  expect(wallet.hashedPassword).toBe('702434');
  wallet.accountNonce = 123;
  expect(wallet.accountNonce).toBe(123);
  expect(() => {
    wallet.version = 'a.b.c';
  }).toThrow();
  wallet.version = '0.1.0';
  expect(wallet.version).toBe('0.1.0');
  wallet.version = undefined;
  expect(wallet.version).toBe(undefined);
});
