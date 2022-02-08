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
  db = await createDatabase('test.db');
  walletHandler = new WalletHandler(db);
  accountHandler = new AccountHandler(walletHandler, db);
  wallet = await walletHandler.createWallet(walletMasterSeed, walletPassword);
});

afterEach(() => {
  db.database.close();
});

test('Test AccountHandler addAccount', async () => {
  await expect(accountHandler.addAccount('wrong password', '')).rejects.toThrow();
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  expect(account1.name).toBe('account 1');
  expect(account1.walletId).toBe(wallet.id);
  const verifySK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const expectedVerifyPK1 = account1.protocol.publicKeyForVerification(toBuff(verifySK1));
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(expectedVerifyPK1));
  const encSK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const expectedEncPK1 = account1.protocol.publicKeyForEncryption(toBuff(encSK1));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(expectedEncPK1));
  expect(account1.toString()).toBe(accountHandler.getAccount(account1.id).toString());
  expect(walletHandler.getCurrentWallet().accountNonce).toBe(2);
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  expect(account2.toString()).toBe(accountHandler.getAccount(account2.shieldedAddress).toString());
  expect(account2.toString()).toBe(accountHandler.getAccount(account2).toString());
  expect(toHexNoPrefix(account2.verifyPublicKey)).not.toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).not.toBe(toHexNoPrefix(account1.encPublicKey));
  expect(account2.encryptedVerifySecretKey).not.toBe(account1.encryptedVerifySecretKey);
  expect(account2.encryptedEncSecretKey).not.toBe(account1.encryptedEncSecretKey);
  expect(walletHandler.getCurrentWallet().accountNonce).toBe(4);
});

test('Test AccountHandler with same seed', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  await walletHandler.createWallet(walletMasterSeed, 'differentP@ssw0rd');
  const otherAccountHandler = new AccountHandler(walletHandler, db);
  const account3 = await otherAccountHandler.addAccount('differentP@ssw0rd', 'account 3');
  const account4 = await otherAccountHandler.addAccount('differentP@ssw0rd', 'account 4');
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(account3.verifyPublicKey));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(account3.encPublicKey));
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account4.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account4.encPublicKey));
});

test('Test AccountHandler getAccounts', async () => {
  let accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(0);
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(1);
  expect(accounts[0].toString()).toBe(account1.toString());
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  accounts = accountHandler.getAccounts(wallet);
  expect(accounts.length).toBe(2);
  expect(accounts[1].toString()).toBe(account2.toString());
});

test('Test AccountHandler getAccount', async () => {
  const account = await accountHandler.addAccount(walletPassword, 'account 1');
  expect(accountHandler.getAccount(account.id).toString()).toBe(account.toString());
  expect(accountHandler.getAccount(account.shieldedAddress).toString()).toBe(account.toString());
  expect(accountHandler.getAccount(account).toString()).toBe(account.toString());
  expect(accountHandler.getAccount(12342344)).toBe(undefined);
});

test('Test AccountHandler exportAccountSecretKey', async () => {
  const account = await accountHandler.addAccount(walletPassword, 'account 1');
  expect(() => {
    accountHandler.exportAccountSecretKey('wrong password', account);
  }).toThrow();
  expect(() => {
    accountHandler.exportAccountSecretKey(walletPassword, 1000);
  }).toThrow();
  const secretKey = accountHandler.exportAccountSecretKey(walletPassword, account.id);
  const verifySK = account.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
  const encSK = account.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
  const expected = account.protocol.fullSecretKey(toBuff(verifySK), toBuff(encSK));
  expect(toHexNoPrefix(secretKey)).toBe(toHexNoPrefix(expected));
});

test('Test AccountHandler importAccountFromSecretKey', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  const secretKey = accountHandler.exportAccountSecretKey(walletPassword, account1);
  await accountHandler.removeAccount(walletPassword, account1);
  await expect(
    accountHandler.importAccountFromSecretKey('wrong password', 'account 2', secretKey),
  ).rejects.toThrow();
  const account2 = await accountHandler.importAccountFromSecretKey(walletPassword, 'account 2', secretKey);
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account1.encPublicKey));
  expect(accountHandler.getAccounts().length).toBe(1);
  await accountHandler.importAccountFromSecretKey(walletPassword, 'account 2', secretKey);
  expect(accountHandler.getAccounts().length).toBe(1);
});

test('Test AccountHandler updateAccountKeys', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  const verifySK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const encSK1 = account1.protocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  const verifySK2 = account2.protocol.decryptSymmetric(walletPassword, account2.encryptedVerifySecretKey);
  const encSK2 = account2.protocol.decryptSymmetric(walletPassword, account2.encryptedEncSecretKey);
  await expect(accountHandler.updateAccountKeys('wrong password', 'new password')).rejects.toThrow();
  await accountHandler.updateAccountKeys(walletPassword, 'newP@ssw0rd');
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

test('Test AccountHandler removeAccount', async () => {
  const account = await accountHandler.addAccount(walletPassword, 'account 1');
  await expect(accountHandler.removeAccount(walletPassword, 12342324)).rejects.toThrow();
  await expect(accountHandler.removeAccount('wrong password', account)).rejects.toThrow();
  await accountHandler.removeAccount(walletPassword, account);
  expect(accountHandler.getAccounts().length).toBe(0);
});

test('Test AccountHandler updateAccountName', async () => {
  const account = await accountHandler.addAccount(walletPassword, 'account 1');
  await expect(accountHandler.updateAccountName(walletPassword, 12342324, 'account 1.1')).rejects.toThrow(
    new Error('12342324 does not exist'),
  );
  await expect(accountHandler.updateAccountName('wrong password', account, 'account 1.1')).rejects.toThrow();
  await accountHandler.updateAccountName(walletPassword, account.id, 'account 1.1');
  expect(accountHandler.getAccount(account.id).name).toBe('account 1.1');
});
