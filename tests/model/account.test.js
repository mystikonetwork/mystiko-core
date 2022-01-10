import { Account } from '../../src/model/account';

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
  account.verifyPublicKey = 'deadbeef';
  expect(account.verifyPublicKey).toBe('deadbeef');
  account.encPublicKey = 'baadf00d';
  expect(account.encPublicKey).toBe('baadf00d');
  account.encryptedVerifySecretKey = 'deaddead';
  expect(account.encryptedVerifySecretKey).toBe('deaddead');
  account.encryptedEncSecretKey = 'baadbabe';
  expect(account.encryptedEncSecretKey).toBe('baadbabe');
  account.walletId = 1234;
  expect(account.walletId).toBe(1234);
  expect(account.fullPublicKey).toBe('deadbeefbaadf00d');
  expect(account.shieldedAddress).toBe('eFGDJTVwVLY');
});

test('Test Account parse public keys', () => {
  expect(() => Account.getPublicKeys('eFGDJTVwVLY')).toThrow('cannot get public keys from invalid address');
  expect(() => Account.getPublicKeys('eFGDJ==TVwVLY')).toThrow('cannot get public keys from invalid address');
  const keys = Account.getPublicKeys(
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6',
  );
  expect(keys[0]).toBe('d8f7c0ef9b5bb47aa466c4b79b7dfac5327defa243ca815e907b854e3057478b');
  expect(keys[1]).toBe('9c9151edf3472722601dc6cf0f5466b1e31665c864dcf2c3ba70243445776601ab');
});

test('Test Account parse secret keys', () => {
  expect(() =>
    Account.getSecretKeys('d8f7c0ef9b5bb47aa466c4b79b7dfac5327defa243ca815e907b854e3057478b'),
  ).toThrow('invalid account secret key length, it should be 64');
  const keys = Account.getSecretKeys(
    'd8f7c0ef9b5bb47aa466c4b79b7dfac5327defa243ca815e907b854e3057478b9c9151edf3472722601dc6cf0f5466b1e31665c864dcf2c3ba70243445776601',
  );
  expect(keys[0]).toBe('d8f7c0ef9b5bb47aa466c4b79b7dfac5327defa243ca815e907b854e3057478b');
  expect(keys[1]).toBe('9c9151edf3472722601dc6cf0f5466b1e31665c864dcf2c3ba70243445776601');
});
