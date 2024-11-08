import { AccountStatus, initDatabase, Wallet } from '@mystikonetwork/database';
import { readJsonFile, toHexNoPrefix } from '@mystikonetwork/utils';
import {
  AccountHandlerV2,
  CommitmentHandlerV2,
  createError,
  DEFAULT_ACCOUNT_SCAN_SIZE,
  MystikoContext,
  MystikoErrorCode,
  NullifierHandlerV2,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContext;
let handler: AccountHandlerV2;
let wallet: Wallet;
const walletMasterSeed = 'deadbeef';
const walletPassword = 'P@ssw0rd';

beforeAll(async () => {
  context = await createTestContext();
  context.wallets = new WalletHandlerV2(context);
  context.commitments = new CommitmentHandlerV2(context);
  context.nullifiers = new NullifierHandlerV2(context);
});

beforeEach(async () => {
  handler = new AccountHandlerV2(context);
  wallet = await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
});

afterEach(async () => {
  await context.db.wallets.clear();
  await context.db.accounts.clear();
});

afterAll(async () => {
  await context.db.remove();
});

test('test count', async () => {
  expect(await handler.count()).toBe(0);
  const account = await handler.create(walletPassword);
  expect(await handler.count()).toBe(1);
  expect(await handler.count({ selector: { id: { $ne: account.id } } })).toBe(0);
});

test('test create', async () => {
  await expect(handler.create('wrong password')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
  const account = await handler.create(walletPassword);
  expect(account.publicKeyForVerification(handler.protocol)).toStrictEqual(
    handler.protocol.publicKeyForVerification(
      account.secretKeyForVerification(handler.protocol, walletPassword),
    ),
  );
  expect(account.publicKeyForEncryption(handler.protocol)).toStrictEqual(
    handler.protocol.publicKeyForEncryption(account.secretKeyForEncryption(handler.protocol, walletPassword)),
  );
  expect(account.publicKey).toBe(
    toHexNoPrefix(
      handler.protocol.fullPublicKey(
        account.publicKeyForVerification(handler.protocol),
        account.publicKeyForEncryption(handler.protocol),
      ),
    ),
  );
  expect(account.shieldedAddress).toBe(
    handler.protocol.shieldedAddress(
      account.publicKeyForVerification(handler.protocol),
      account.publicKeyForEncryption(handler.protocol),
    ),
  );
  expect(account.wallet).toBe(wallet.id);
  expect(wallet.accountNonce).toBe(2);
});

test('test create names', async () => {
  const account1 = await handler.create(walletPassword, {});
  expect(account1.name).toBe('Account 1');
  expect(account1.status).toBe(AccountStatus.CREATED);
  const account2 = await handler.create(walletPassword, {});
  expect(account2.name).toBe('Account 2');
  const account3 = await handler.create(walletPassword, { name: '' });
  expect(account3.name).toBe('Account 3');
  const account4 = await handler.create(walletPassword, { name: 'My Account' });
  expect(account4.name).toBe('My Account');
  expect(wallet.accountNonce).toBe(8);
  const account5 = await handler.create(walletPassword, { name: 'My Account', scanSize: 0 });
  expect(account5.scanSize).toBe(DEFAULT_ACCOUNT_SCAN_SIZE);
  const account6 = await handler.create(walletPassword, {
    name: 'My Account',
    scanSize: 100,
  });
  expect(account6.scanSize).toBe(100);
});

test('test import', async () => {
  const account1 = await handler.create(walletPassword);
  const secretKey = account1.secretKey(handler.protocol, walletPassword);
  await handler.db.accounts.bulkRemove([account1.id]);
  const account2 = await handler.create(walletPassword, { secretKey, name: 'name 1' });
  expect(account2.shieldedAddress).toBe(account1.shieldedAddress);
  const account3 = await handler.create(walletPassword, { secretKey, name: 'name 2' });
  expect(account3.name).toBe('name 1');
  expect(wallet.accountNonce).toBe(2);
});

test('test create consistency', async () => {
  const account1 = await handler.create(walletPassword);
  const account2 = await handler.create(walletPassword);
  const wallet2 = await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
  const account3 = await handler.create(walletPassword);
  const account4 = await handler.create(walletPassword);
  expect(account3.wallet).toBe(wallet2.id);
  expect(account4.wallet).toBe(wallet2.id);
  expect(account3.shieldedAddress).toBe(account1.shieldedAddress);
  expect(account4.shieldedAddress).toBe(account2.shieldedAddress);
  expect(wallet2.accountNonce).toBe(4);
});

test('test create with existing derived keys', async () => {
  const account1 = await handler.create(walletPassword);
  const account2 = await handler.create(walletPassword);
  const account3 = await handler.create(walletPassword);
  const account2FullSecretKey = await handler.export(walletPassword, account2.publicKey);
  const wallet2 = await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
  const account4 = await handler.create(walletPassword);
  const account5 = await handler.create(walletPassword, { secretKey: account2FullSecretKey });
  expect(wallet2.accountNonce).toBe(2);
  const account6 = await handler.create(walletPassword);
  expect(account4.shieldedAddress).toBe(account1.shieldedAddress);
  expect(account5.shieldedAddress).toBe(account2.shieldedAddress);
  expect(account6.shieldedAddress).toBe(account3.shieldedAddress);
  expect(wallet2.accountNonce).toBe(6);
});

test('test encrypt', async () => {
  const newWalletPassword = 'newP@ssw0rd';
  const account1 = await handler.create(walletPassword);
  const secretKey1 = account1.secretKey(handler.protocol, walletPassword);
  const updatedAt1 = account1.updatedAt;
  const account2 = await handler.create(walletPassword);
  const secretKey2 = account2.secretKey(handler.protocol, walletPassword);
  const updatedAt2 = account2.updatedAt;
  await expect(handler.encrypt('wrong password', newWalletPassword)).rejects.toThrow();
  await handler.encrypt(walletPassword, newWalletPassword);
  expect(account1.secretKey(handler.protocol, newWalletPassword)).toBe(secretKey1);
  expect(account2.secretKey(handler.protocol, newWalletPassword)).toBe(secretKey2);
  expect(account1.updatedAt).not.toBe(updatedAt1);
  expect(account2.updatedAt).not.toBe(updatedAt2);
});

test('test encrypt different wallet', async () => {
  const newWalletPassword = 'newP@ssw0rd';
  const account1 = await handler.create(walletPassword);
  await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
  await handler.encrypt(walletPassword, newWalletPassword);
  const account2 = await handler.db.accounts.findOne(account1.id).exec();
  expect(account2?.encryptedSecretKey).toBe(account1.encryptedSecretKey);
});

test('test export', async () => {
  const account = await handler.create(walletPassword);
  await expect(handler.export('wrong password', account.id)).rejects.toThrow();
  const secretKey = await handler.export(walletPassword, account.id);
  await handler.db.accounts.bulkRemove([account.id]);
  const newAccount = await handler.create(walletPassword, { secretKey });
  expect(newAccount.shieldedAddress).toBe(account.shieldedAddress);
});

test('test find', async () => {
  const account1 = await handler.create(walletPassword);
  const wallet1 = await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
  expect((await handler.find()).length).toBe(0);
  expect(
    (
      await handler.find({
        selector: { wallet: wallet.id },
      })
    ).length,
  ).toBe(0);
  const account2 = await handler.create(walletPassword);
  expect((await handler.find({ selector: { id: account1.id } })).length).toBe(0);
  expect((await handler.find({ selector: { id: account2.id } })).length).toBe(1);
  const accounts = await handler.find();
  expect(accounts.length).toBe(1);
  expect(accounts[0].wallet).toBe(wallet1.id);
});

test('test findOne', async () => {
  expect(await handler.findOne('non existing identifier')).toBe(null);
  const account1 = await handler.create(walletPassword);
  await context.wallets.create({ masterSeed: walletMasterSeed, password: walletPassword });
  const account2 = await handler.create(walletPassword);
  expect(await handler.findOne(account1.id)).toBe(null);
  expect(await handler.findOne(account2.id)).toStrictEqual(account2);
  expect(await handler.findOne(account2.shieldedAddress)).toStrictEqual(account2);
  expect(await handler.findOne(account2.publicKey)).toStrictEqual(account2);
});

test('test update', async () => {
  const newName = 'new name';
  const newScanSize = 100;
  const newStatus = AccountStatus.SCANNING;
  const account = await handler.create(walletPassword);
  const previousName = account.name;
  const previousScanSize = account.scanSize;
  const previousStatus = account.status as AccountStatus;
  await expect(handler.update('wrong password', account.id, { name: newName })).rejects.toThrow();
  const previousUpdatedAt = account.updatedAt;
  await handler.update(walletPassword, account.id, {});
  expect(account.name).toBe(previousName);
  expect(account.scanSize).toBe(previousScanSize);
  expect(account.status).toBe(previousStatus);
  expect(account.updatedAt).toBe(previousUpdatedAt);
  await handler.update(walletPassword, account.id, { name: '', scanSize: 0 });
  expect(account.name).toBe(previousName);
  expect(account.scanSize).toBe(previousScanSize);
  expect(account.updatedAt).toBe(previousUpdatedAt);
  await handler.update(walletPassword, account.id, {
    name: previousName,
    scanSize: previousScanSize,
    status: previousStatus,
  });
  expect(account.name).toBe(previousName);
  expect(account.scanSize).toBe(previousScanSize);
  expect(account.status).toBe(previousStatus);
  expect(account.updatedAt).toBe(previousUpdatedAt);
  await handler.update(walletPassword, account.id, {
    name: newName,
    scanSize: newScanSize,
    status: newStatus,
  });
  expect(account.name).toBe(newName);
  expect(account.scanSize).toBe(newScanSize);
  expect(account.status).toBe(newStatus);
  expect(account.updatedAt).not.toBe(previousUpdatedAt);
  await expect(handler.update(walletPassword, 'wrong id', { name: 'new name' })).rejects.toThrow(
    createError('non existing account wrong id', MystikoErrorCode.NON_EXISTING_ACCOUNT),
  );
});

test('test resetScan', async () => {
  let account1 = await handler.create(walletPassword);
  let account2 = await handler.create(walletPassword);
  expect(account1.scannedCommitmentId).toBe(undefined);
  expect(account2.scannedCommitmentId).toBe(undefined);
  account1 = await account1.atomicUpdate((accountData) => {
    accountData.scannedCommitmentId = '1';
    return accountData;
  });
  account2 = await account2.atomicUpdate((accountData) => {
    accountData.scannedCommitmentId = '2';
    return accountData;
  });
  expect(account1.scannedCommitmentId).toBe('1');
  expect(account2.scannedCommitmentId).toBe('2');
  await handler.resetScan({ selector: { id: account1.id } });
  expect((await handler.findOne(account1.id))?.scannedCommitmentId).toBe(undefined);
  await handler.resetScan(account2.shieldedAddress);
  expect((await handler.findOne(account2.id))?.scannedCommitmentId).toBe(undefined);
});

test('test resetScan when scanning', async () => {
  let account = await handler.create(walletPassword);
  await account.atomicUpdate((accountData) => {
    accountData.status = AccountStatus.SCANNING;
    return accountData;
  });
  account = await account.atomicUpdate((accountData) => {
    accountData.scannedCommitmentId = '1';
    return accountData;
  });
  await expect(handler.resetScan(account.id)).rejects.toThrow(
    new Error(`account ${account.shieldedAddress} is currently scanning, please try again later`),
  );
  await handler.resetScan(account.id, true);
  expect((await handler.findOne(account.id))?.scannedCommitmentId).toBe(undefined);
});

test('test scan', async () => {
  await context.db.remove();
  context.db = await initDatabase();
  const databaseData = await readJsonFile('tests/files/database.sync.test.json');
  await context.db.importJSON(databaseData);
  const accounts = await handler.scan(walletPassword);
  expect(accounts.length).toBe(2);
  accounts.forEach((account) => {
    expect(account.status).toBe(AccountStatus.SCANNED);
  });
});

test('test scan when scanning', async () => {
  const account = await handler.create(walletPassword);
  await account.atomicUpdate((accountData) => {
    accountData.status = AccountStatus.SCANNING;
    return accountData;
  });
  await handler.scan(walletPassword, account.id);
  expect((await handler.findOne(account.id))?.status).toBe(AccountStatus.SCANNING);
});
