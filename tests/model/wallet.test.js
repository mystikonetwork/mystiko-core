import { Wallet } from '../../src/model';

test('Test Wallet getters/setters', () => {
  const wallet = new Wallet();
  expect(wallet.id).toBe(undefined);
  expect(wallet.encryptedMasterSeed).toBe(undefined);
  expect(wallet.hashedPassword).toBe(undefined);
  expect(wallet.accountNonce).toBe(undefined);
  wallet.encryptedMasterSeed = '6b1e3166';
  expect(wallet.encryptedMasterSeed).toBe('6b1e3166');
  wallet.hashedPassword = '702434';
  expect(wallet.hashedPassword).toBe('702434');
  wallet.accountNonce = 123;
  expect(wallet.accountNonce).toBe(123);
});
