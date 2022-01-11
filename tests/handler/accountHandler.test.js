import { babyJub, eddsa } from 'circomlib';
import { PrivateKey as EciesPrivateKey } from 'eciesjs';
import { AccountHandler } from '../../src/handler/accountHandler.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { Handler } from '../../src/handler/handler.js';
import { createDatabase } from '../../src/database.js';

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
  const verifySK1 = Handler.aesDecrypt(account1.encryptedVerifySecretKey, walletPassword);
  const expectedVeriyPK1 = babyJub.packPoint(eddsa.prv2pub(Buffer.from(verifySK1, 'hex')));
  expect(account1.verifyPublicKey).toBe(Buffer.from(expectedVeriyPK1).toString('hex'));
  const encSK1 = Handler.aesDecrypt(account1.encryptedEncSecretKey, walletPassword);
  const expectedEncPK1 = new EciesPrivateKey(Buffer.from(encSK1, 'hex')).publicKey;
  expect(account1.encPublicKey).toBe(expectedEncPK1.toHex());
  expect(account1.toString()).toBe(
    accountHandler.getAccountByShieldedAddress(account1.shieldedAddress).toString(),
  );
  expect(wallet.accountNonce).toBe(2);
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  expect(account2.toString()).toBe(
    accountHandler.getAccountByShieldedAddress(account2.shieldedAddress).toString(),
  );
  expect(account2.verifyPublicKey).not.toBe(account1.verifyPublicKey);
  expect(account2.encPublicKey).not.toBe(account1.encPublicKey);
  expect(account2.encryptedVerifySecretKey).not.toBe(account1.encryptedVerifySecretKey);
  expect(account2.encryptedEncSecretKey).not.toBe(account1.encryptedEncSecretKey);
  expect(wallet.accountNonce).toBe(4);
});

test('Test AccountHandler addAccount with same seed', async () => {
  const otherWallet = await walletHandler.createWallet(walletMasterSeed, 'differentP@ssw0rd');
  const otherAccountHandler = new AccountHandler(walletHandler, db);
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  const account3 = await otherAccountHandler.addAccount(otherWallet, 'differentP@ssw0rd', 'account 3');
  const account4 = await otherAccountHandler.addAccount(otherWallet, 'differentP@ssw0rd', 'account 4');
  expect(account1.verifyPublicKey).toBe(account3.verifyPublicKey);
  expect(account1.encPublicKey).toBe(account3.encPublicKey);
  expect(account2.verifyPublicKey).toBe(account4.verifyPublicKey);
  expect(account2.encPublicKey).toBe(account4.encPublicKey);
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
  const verifySK = Handler.aesDecrypt(account.encryptedVerifySecretKey, walletPassword);
  const encSK = Handler.aesDecrypt(account.encryptedEncSecretKey, walletPassword);
  expect(secretKey).toBe(verifySK + encSK);
});

test('Test AccountHandler importAccountFromSecretKey', async () => {
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const secretKey = accountHandler.exportAccountSecretKey(wallet, walletPassword, account1);
  await accountHandler.removeAccount(account1);
  await expect(
    accountHandler.importAccountFromSecretKey(wallet, 'wrong password', 'account 2', secretKey),
  ).rejects.toThrow();
  const account2 = await accountHandler.importAccountFromSecretKey(
    wallet,
    walletPassword,
    'account 2',
    secretKey,
  );
  expect(account2.verifyPublicKey).toBe(account1.verifyPublicKey);
  expect(account2.encPublicKey).toBe(account1.encPublicKey);
});

test('Test AccountHandler updateAccountKeys', async () => {
  const account1 = await accountHandler.addAccount(wallet, walletPassword, 'account 1');
  const verifySK1 = Handler.aesDecrypt(account1.encryptedVerifySecretKey, walletPassword);
  const encSK1 = Handler.aesDecrypt(account1.encryptedEncSecretKey, walletPassword);
  const account2 = await accountHandler.addAccount(wallet, walletPassword, 'account 2');
  const verifySK2 = Handler.aesDecrypt(account2.encryptedVerifySecretKey, walletPassword);
  const encSK2 = Handler.aesDecrypt(account2.encryptedEncSecretKey, walletPassword);
  await expect(accountHandler.updateAccountKeys(wallet, 'wrong password', 'new password')).rejects.toThrow();
  await accountHandler.updateAccountKeys(wallet, walletPassword, 'newP@ssw0rd');
  const [account3, account4] = accountHandler.getAccounts(wallet);
  expect(Handler.aesDecrypt(account3.encryptedVerifySecretKey, 'newP@ssw0rd')).toBe(verifySK1);
  expect(Handler.aesDecrypt(account3.encryptedEncSecretKey, 'newP@ssw0rd')).toBe(encSK1);
  expect(Handler.aesDecrypt(account4.encryptedVerifySecretKey, 'newP@ssw0rd')).toBe(verifySK2);
  expect(Handler.aesDecrypt(account4.encryptedEncSecretKey, 'newP@ssw0rd')).toBe(encSK2);
});
