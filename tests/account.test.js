import { Account, VERIFY_PUBLIC_KEY_LEN, ENC_PUBLIC_KEY_LEN, FULL_PUBLIC_KEY_LEN } from '../src/account.js';

test('Test Account Basic', () => {
  const account1 = new Account();
  expect(account1.verifyPublicKey.length).toBe(VERIFY_PUBLIC_KEY_LEN);
  expect(account1.encPublicKey.length).toBe(ENC_PUBLIC_KEY_LEN);
  expect(account1.fullPublicKey.length).toBe(FULL_PUBLIC_KEY_LEN);

  const account2 = new Account(
    Buffer.from('0001020304050607080900010203040506070809000102030405060708090001', 'hex'),
    Buffer.from('95d3c5e483e9b1d4f5fc8e79b2deaf51362980de62dbb082a9a4257eef653d7d', 'hex'),
  );

  expect(account2.verifyPublicKey.toString('hex')).toBe(
    'c433f7a696b7aa3a5224efb3993baf0ccd9e92eecee0c29a3f6c8208a9e81d9e',
  );
  expect(account2.encPublicKey.toString('hex')).toBe(
    '0398afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140',
  );
  expect(account2.fullPublicKey.toString('hex')).toBe(
    'c433f7a696b7aa3a5224efb3993baf0ccd9e92eecee0c29a3f6c8208a9e81d9e' +
      '0398afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140',
  );
  expect(account2.address).toBe(
    'JKDeAttCcJpeePz2KUVcFPnZumm5eMALWVQQtMx4XryD83Sr2MaXQL9NHrAubxUQ6yUhhUre9jMVRi3SBZZKnkJ1M',
  );
});

test('Test Account Encrypt/Decrypt', () => {
  const account = new Account();
  const text = 'Hello World';
  const encryptedText = Account.encrypt(account.encPublicKey, Buffer.from(text));
  expect(Account.decrypt(account.encPrivateKey, encryptedText).toString()).toBe(text);
});

test('Test isValidAddress', () => {
  expect(Account.isValidAddress('&ed3wdd')).toBe(false);
  expect(Account.isValidAddress('ed3wdd4rfsdfDDFer')).toBe(false);
  expect(Account.isValidAddress('16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS')).toBe(false);
  expect(
    Account.isValidAddress(
      'JKDeAttCcJpeePz2KUVcFPnZumm5eMALWVQQtMx4XryD83Sr2MaXQL9NHrAubxUQ6yUhhUre9jMVRi3SBZZKnkJ1M',
    ),
  ).toBe(true);
});

test('Test getPublicKeys', () => {
  const keys = Account.getPublicKeys(
    'JKDeAttCcJpeePz2KUVcFPnZumm5eMALWVQQtMx4XryD83Sr2MaXQL9NHrAubxUQ6yUhhUre9jMVRi3SBZZKnkJ1M',
  );
  expect(keys[0].toString('hex')).toBe('c433f7a696b7aa3a5224efb3993baf0ccd9e92eecee0c29a3f6c8208a9e81d9e');
  expect(keys[1].toString('hex')).toBe('0398afe4f150642cd05cc9d2fa36458ce0a58567daeaf5fde7333ba9b403011140');
});
