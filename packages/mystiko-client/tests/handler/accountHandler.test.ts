import { currentProtocol } from '@mystiko/protocol';
import { toBuff, toHexNoPrefix } from '@mystiko/utils';
import { AccountHandler, WalletHandler, Wallet, createDatabase, MystikoDatabase } from '../../src';

let db: MystikoDatabase;
let wallet: Wallet;
let walletHandler: WalletHandler;
let accountHandler: AccountHandler;
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
  if (
    !account1.id ||
    !account1.verifyPublicKey ||
    !account1.encPublicKey ||
    !account1.encryptedVerifySecretKey ||
    !account1.encryptedEncSecretKey
  ) {
    throw new Error('some fields are not properly set');
  }
  expect(account1.name).toBe('account 1');
  expect(account1.walletId).toBe(wallet.id);
  const verifySK1 = currentProtocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const expectedVerifyPK1 = currentProtocol.publicKeyForVerification(toBuff(verifySK1));
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(expectedVerifyPK1));
  const encSK1 = currentProtocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const expectedEncPK1 = currentProtocol.publicKeyForEncryption(toBuff(encSK1));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(expectedEncPK1));
  expect(account1.toString()).toBe(accountHandler.getAccount(account1.id)?.toString());
  expect(walletHandler.getCurrentWallet()?.accountNonce).toBe(2);
  const account2 = await accountHandler.addAccount(walletPassword);
  if (
    !account2.verifyPublicKey ||
    !account2.encPublicKey ||
    !account2.encryptedVerifySecretKey ||
    !account2.encryptedEncSecretKey ||
    !account2.shieldedAddress
  ) {
    throw new Error('some fields are not properly set');
  }
  expect(account2.name).toBe('Account 2');
  expect(account2.toString()).toBe(accountHandler.getAccount(account2.shieldedAddress)?.toString());
  expect(account2.toString()).toBe(accountHandler.getAccount(account2)?.toString());
  expect(toHexNoPrefix(account2.verifyPublicKey)).not.toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).not.toBe(toHexNoPrefix(account1.encPublicKey));
  expect(account2.encryptedVerifySecretKey).not.toBe(account1.encryptedVerifySecretKey);
  expect(account2.encryptedEncSecretKey).not.toBe(account1.encryptedEncSecretKey);
  expect(walletHandler.getCurrentWallet()?.accountNonce).toBe(4);
  const account3 = await accountHandler.addAccount(walletPassword, '');
  expect(account3.name).toBe('Account 3');
  db.wallets.update({ ...wallet.data, encryptedMasterSeed: undefined });
  await expect(accountHandler.addAccount(walletPassword, '')).rejects.toThrow();
});

test('Test AccountHandler with same seed', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  if (!account1.verifyPublicKey || !account1.encPublicKey) {
    throw new Error('some fields are not properly set');
  }
  if (!account2.verifyPublicKey || !account2.encPublicKey) {
    throw new Error('some fields are not properly set');
  }
  await walletHandler.createWallet(walletMasterSeed, 'differentP@ssw0rd');
  const otherAccountHandler = new AccountHandler(walletHandler, db);
  const account3 = await otherAccountHandler.addAccount('differentP@ssw0rd', 'account 3');
  const account4 = await otherAccountHandler.addAccount('differentP@ssw0rd', 'account 4');
  if (!account3.verifyPublicKey || !account3.encPublicKey) {
    throw new Error('some fields are not properly set');
  }
  if (!account4.verifyPublicKey || !account4.encPublicKey) {
    throw new Error('some fields are not properly set');
  }
  expect(toHexNoPrefix(account1.verifyPublicKey)).toBe(toHexNoPrefix(account3.verifyPublicKey));
  expect(toHexNoPrefix(account1.encPublicKey)).toBe(toHexNoPrefix(account3.encPublicKey));
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account4.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account4.encPublicKey));
});

test('Test AccountHandler getAccounts', async () => {
  let accounts = accountHandler.getAccounts();
  expect(accounts.length).toBe(0);
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  accounts = accountHandler.getAccounts();
  expect(accounts.length).toBe(1);
  expect(accounts[0].toString()).toBe(account1.toString());
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  accounts = accountHandler.getAccounts();
  expect(accounts.length).toBe(2);
  expect(accounts[1].toString()).toBe(account2.toString());
});

test('Test AccountHandler getAccount', async () => {
  const account = await accountHandler.addAccount(walletPassword, 'account 1');
  if (!account.id || !account.shieldedAddress) {
    throw new Error('some fields are not properly set');
  }
  expect(accountHandler.getAccount(account.id)?.toString()).toBe(account.toString());
  expect(accountHandler.getAccount(account.shieldedAddress)?.toString()).toBe(account.toString());
  expect(accountHandler.getAccount(account)?.toString()).toBe(account.toString());
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
  const accountId = account.id;
  if (!accountId || !account.encryptedVerifySecretKey || !account.encryptedEncSecretKey) {
    throw new Error('some fields are not properly set');
  }
  const secretKey = accountHandler.exportAccountSecretKey(walletPassword, accountId);
  const verifySK = currentProtocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey);
  const encSK = currentProtocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey);
  const expected = currentProtocol.fullSecretKey(toBuff(verifySK), toBuff(encSK));
  expect(toHexNoPrefix(secretKey)).toBe(toHexNoPrefix(expected));
  db.accounts.update({ ...account.data, encryptedEncSecretKey: undefined });
  expect(() => {
    accountHandler.exportAccountSecretKey(walletPassword, accountId);
  }).toThrow();
  db.accounts.update({ ...account.data, encryptedVerifySecretKey: undefined });
  expect(() => {
    accountHandler.exportAccountSecretKey(walletPassword, accountId);
  }).toThrow();
});

test('Test AccountHandler importAccountFromSecretKey', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  if (!account1 || !account1.verifyPublicKey || !account1.encPublicKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  const secretKey = accountHandler.exportAccountSecretKey(walletPassword, account1);
  await accountHandler.removeAccount(walletPassword, account1);
  await expect(
    accountHandler.importAccountFromSecretKey('wrong password', 'account 2', secretKey),
  ).rejects.toThrow();
  let account2 = await accountHandler.importAccountFromSecretKey(walletPassword, '', secretKey);
  if (!account2.verifyPublicKey || !account2.encPublicKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  expect(account2.name).toBe('Account 1');
  expect(toHexNoPrefix(account2.verifyPublicKey)).toBe(toHexNoPrefix(account1.verifyPublicKey));
  expect(toHexNoPrefix(account2.encPublicKey)).toBe(toHexNoPrefix(account1.encPublicKey));
  expect(accountHandler.getAccounts().length).toBe(1);
  await accountHandler.importAccountFromSecretKey(walletPassword, 'account 2', secretKey);
  expect(accountHandler.getAccounts().length).toBe(1);
  await accountHandler.removeAccount(walletPassword, account2);
  account2 = await accountHandler.importAccountFromSecretKey(walletPassword, 'Some Name', secretKey);
  expect(account2.name).toBe('Some Name');
  await accountHandler.removeAccount(walletPassword, account2);
  account2 = await accountHandler.importAccountFromSecretKey(walletPassword, '', secretKey);
  expect(account2.name).toBe('Account 1');
});

test('Test AccountHandler updateAccountKeys', async () => {
  const account1 = await accountHandler.addAccount(walletPassword, 'account 1');
  if (!account1 || !account1.encryptedVerifySecretKey || !account1.encryptedEncSecretKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  const verifySK1 = currentProtocol.decryptSymmetric(walletPassword, account1.encryptedVerifySecretKey);
  const encSK1 = currentProtocol.decryptSymmetric(walletPassword, account1.encryptedEncSecretKey);
  const account2 = await accountHandler.addAccount(walletPassword, 'account 2');
  if (!account2 || !account2.encryptedVerifySecretKey || !account2.encryptedEncSecretKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  const verifySK2 = currentProtocol.decryptSymmetric(walletPassword, account2.encryptedVerifySecretKey);
  const encSK2 = currentProtocol.decryptSymmetric(walletPassword, account2.encryptedEncSecretKey);
  await expect(accountHandler.updateAccountKeys('wrong password', 'new password')).rejects.toThrow();
  await accountHandler.updateAccountKeys(walletPassword, 'newP@ssw0rd');
  const [account3, account4] = accountHandler.getAccounts();
  if (!account3 || !account3.encryptedVerifySecretKey || !account3.encryptedEncSecretKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  if (!account4 || !account4.encryptedVerifySecretKey || !account4.encryptedEncSecretKey) {
    throw new Error('some fields are not set or failed to get account');
  }
  expect(currentProtocol.decryptSymmetric('newP@ssw0rd', account3.encryptedVerifySecretKey)).toBe(verifySK1);
  expect(currentProtocol.decryptSymmetric('newP@ssw0rd', account3.encryptedEncSecretKey)).toBe(encSK1);
  expect(currentProtocol.decryptSymmetric('newP@ssw0rd', account4.encryptedVerifySecretKey)).toBe(verifySK2);
  expect(currentProtocol.decryptSymmetric('newP@ssw0rd', account4.encryptedEncSecretKey)).toBe(encSK2);
  db.accounts.update({ ...account3.data, encryptedEncSecretKey: undefined });
  await expect(accountHandler.updateAccountKeys(walletPassword, 'newP@ssw0rd')).rejects.toThrow();
  db.accounts.update(account3.data);
  db.accounts.update({ ...account4.data, encryptedVerifySecretKey: undefined });
  await expect(accountHandler.updateAccountKeys(walletPassword, 'newP@ssw0rd')).rejects.toThrow();
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
  if (!account.id) {
    throw new Error('some fields are not set');
  }
  await expect(accountHandler.updateAccountName(walletPassword, 12342324, 'account 1.1')).rejects.toThrow(
    new Error('12342324 does not exist'),
  );
  await expect(accountHandler.updateAccountName('wrong password', account, 'account 1.1')).rejects.toThrow();
  await accountHandler.updateAccountName(walletPassword, account.id, 'account 1.1');
  expect(accountHandler.getAccount(account.id)?.name).toBe('account 1.1');
  await accountHandler.updateAccountName(walletPassword, account.id, '');
  expect(accountHandler.getAccount(account.id)?.name).toBe('account 1.1');
  await accountHandler.updateAccountName(walletPassword, account.id, undefined);
  expect(accountHandler.getAccount(account.id)?.name).toBe('account 1.1');
});
