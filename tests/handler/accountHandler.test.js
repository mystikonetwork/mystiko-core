import { AccountHandler } from '../../src/handler/accountHandler.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { createDatabase } from '../../src/database.js';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';

let db;
let wallet;
let walletHandler;
let accountHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db', true);
  walletHandler = new WalletHandler(db);
  accountHandler = new AccountHandler(walletHandler, db);
  wallet = await walletHandler.createWallet(walletMasterSeed, walletPassword);
});

afterEach(() => {
  db.database.close();
});

test('Test AccountHandler addAccount', async () => {
  await expect(accountHandler.addAccount(wallet, 'wrong password', '')).rejects.toThrow();
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  expect(account1.name).toBe('account 1');
  expect(account1.walletId).toBe(wallet.id);
  const verifySK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const expectedVeriyPK1 = account1.protocol.publicKeyForVerification(toBuff(verifySK1));
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(expectedVeriyPK1));
  const encSK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const expectedEncPK1 = account1.protocol.publicKeyForEncryption(toBuff(encSK1));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(expectedEncPK1));
  expect(account1.toString()).toBe(
    accountHandler.getAccountByShieldedAddress(account1.shieldedAddress).toString(),
  );
  expect(wallet.accountNonce).toBe(2);
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  expect(account2.toString()).toBe(
    accountHandler.getAccountByShieldedAddress(account2.shieldedAddress).toString(),
  );
  expect(toHexNoPrefix(account2.verifyPublicKey)).not.toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).not.toBe(toHexNoPrefix(account1.encPublicKey));
  expect(account2.encryptedVerifySecretKey).not.toBe(account1.encryptedVerifySecretKey);
  expect(account2.encryptedEncSecretKey).not.toBe(account1.encryptedEncSecretKey);
  expect(wallet.accountNonce).toBe(4);
});

test('Test AccountHandler with same seed', async () => {
  const otherWallet = await walletHandler.createWallet(walletMasterSeed, 'differentP@ssw0rd');
  const otherAccountHandler = new AccountHandler(walletHandler, db);
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  const account3 = await otherAccountHandler.addAccount(otherWallet, 'differentP@ssw0rd', 'account 3');
  const account4 = await otherAccountHandler.addAccount(otherWallet, 'differentP@ssw0rd', 'account 4');
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(account3.verifyPublicKey));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(account3.encPublicKey));
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account4.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account4.encPublicKey));
});

test('Test AccountHandler getAccounts', async () => {
  let accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(0);
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(1);
  expect(accounts[0].toString()).toBe(account1.toString());
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(2);
  expect(accounts[1].toString()).toBe(account2.toString());
});

test('Test AccountHandler exportAccountSecretKey', async () => {
  const account = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  expect(() => {
    accountHandler.exportAccountSecretKey(wallet, 'wrong password', account);
  }).toThrow();
  const secretKey = accountHandler.exportAccountSecretKey(wallet, walletPassword, account);
  const verifySK = account.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
  const encSK = account.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
  const expected = account.protocol.fullSecretKey(toBuff(verifySK), toBuff(encSK));
  expect(toHexNoPrefix(secretKey)).toBe(toHexNoPrefix(expected));
});

test('Test AccountHandler importAccountFromSecretKey', async () => {
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const secretKey = accountHandler.exportAccountSecretKey(wallet, walletPassword, account1);
  await accountHandler.removeAccount(account1);
  await expect(
    accountHandler.importAccountFromSecretKey(wallet, 'wrong password', 'account 2', toBuff(secretKey)),
  ).rejects.toThrow();
  const account2 = await accountHandler.importAccountFromSecretKey(
    wallet,
    walletPassword,
    'account 2',
    toBuff(secretKey),
  );
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account1.encPublicKey));
});

test('Test AccountHandler updateAccountKeys', async () => {
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const verifySK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const encSK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  const verifySK2 = account2.protocol.decryptSymmetric(walletPassword, account2.encryptedVerifySecretKey);
  const encSK2 = account2.protocol.decryptSymmetric(walletPassword, account2.encryptedEncSecretKey);
  await expect(accountHandler.updateAccountKeys(wallet, 'wrong password', 'new password')).rejects.toThrow();
  await accountHandler.updateAccountKeys(wallet, walletPassword, 'newP@ssw0rd');
  const [account3, account4] = accountHandler.getAccounts(wallet);
  expect(account3.protocol.decryptSymmetric('newP@ssw0rd', account3.encryptedVerifySecretKey)).toBe(
    verifySK1,
  );
  expect(account3.protocol.decryptSymmetric('newP@ssw0rd', account3.encryptedEncSecretKey)).toBe(encSK1);
  expect(account4.protocol.decryptSymmetric('newP@ssw0rd', account4.encryptedVerifySecretKey)).toBe(
    verifySK2,
  );
  expect(account4.protocol.decryptSymmetric('newP@ssw0rd', account4.encryptedEncSecretKey)).toBe(encSK2);
});
