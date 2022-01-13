import { Account } from '../../src/model/account';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';

test('Test Account getters/setters', () => {
  const account = new Account();
  expect(account.id).toBe(undefined);
  expect(account.name).toBe(undefined);
  expect(account.verifyPublicKey).toBe(undefined);
  expect(account.encPublicKey).toBe(undefined);
  expect(account.encryptedVerifySecretKey).toBe(undefined);
  expect(account.encryptedEncSecretKey).toBe(undefined);
  expect(account.walletId).toBe(undefined);
  expect(account.fullPublicKey).toBe(undefined);
  expect(account.shieldedAddress).toBe(undefined);
  account.name = 'Test Account #1';
  expect(account.name).toBe('Test Account #1');
  expect(() => {
    account.verifyPublicKey = 'deadbeef';
  }).toThrow();
  account.verifyPublicKey = account.protocol.randomBytes(account.protocol.VERIFY_PK_SIZE);
  expect(toHexNoPrefix(account.verifyPublicKey)).not.toBe(undefined);
  expect(() => {
    account.encPublicKey = 'baadf00d';
  }).toThrow();
  account.encPublicKey = account.protocol.randomBytes(account.protocol.ENCRYPT_PK_SIZE);
  expect(toHexNoPrefix(account.encPublicKey)).not.toBe(undefined);
  account.encryptedVerifySecretKey = 'deaddead';
  expect(account.encryptedVerifySecretKey).toBe('deaddead');
  account.encryptedEncSecretKey = 'baadbabe';
  expect(account.encryptedEncSecretKey).toBe('baadbabe');
  account.walletId = 1234;
  expect(account.walletId).toBe(1234);
  expect(account.fullPublicKey).not.toBe(undefined);
  expect(account.shieldedAddress).not.toBe(undefined);
});
