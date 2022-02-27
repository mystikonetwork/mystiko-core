import { currentProtocol } from '@mystiko/protocol';
import { WalletHandler, createDatabase, MystikoDatabase } from '../../src';

let handler: WalletHandler;
let db: MystikoDatabase;

beforeEach(async () => {
  db = await createDatabase('test.db');
  handler = new WalletHandler(db);
});

afterEach(() => {
  db.database.close();
});

test('Test WalletHandler createWallet', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  const wallet = await handler.createWallet(walletMasterSeed, walletPassword);
  if (wallet.encryptedMasterSeed && wallet.id) {
    expect(currentProtocol.decryptSymmetric(walletPassword, wallet.encryptedMasterSeed)).toBe(
      walletMasterSeed,
    );
    expect(wallet.hashedPassword).toBe(currentProtocol.checkSum(walletPassword));
    expect(wallet.accountNonce).toBe(0);
    expect(handler.getCurrentWallet()?.toString()).toBe(wallet.toString());
    expect(handler.getWalletById(wallet.id)?.toString()).toBe(wallet.toString());
    expect(handler.checkPassword(walletPassword)).toBe(true);
    expect(handler.checkPassword('wrong')).toBe(false);
  } else {
    throw new Error('wallet encryptedMasterSeed or id is undefined');
  }
});

test('Test WalletHandler getCurrentWallet', () => {
  expect(handler.getCurrentWallet()).toBe(undefined);
  expect(() => handler.checkCurrentWallet()).toThrow();
});

test('Test WalletHandler getWallet by id', () => {
  expect(handler.getWalletById(1)).toBe(undefined);
});

test('Test WalletHandler updatePassword', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  await handler.createWallet(walletMasterSeed, walletPassword);
  expect(await handler.updatePassword('wrong', 'new')).toBe(false);
  const newPassword = 'newP@ssw0rd';
  expect(await handler.updatePassword(walletPassword, newPassword)).toBe(true);
  expect(handler.checkPassword(newPassword)).toBe(true);
  const wallet = handler.getCurrentWallet();
  expect(wallet).not.toBe(undefined);
  if (wallet && wallet.encryptedMasterSeed) {
    expect(currentProtocol.decryptSymmetric(newPassword, wallet.encryptedMasterSeed)).toBe(walletMasterSeed);
  } else {
    throw new Error('wallet encryptedMasterSeed is undefined');
  }
  wallet.encryptedMasterSeed = undefined;
  db.wallets.update(wallet.data);
  await expect(handler.updatePassword(walletPassword, newPassword)).rejects.toThrow();
});

test('Test WalletHandler exportMasterSeed', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  await handler.createWallet(walletMasterSeed, walletPassword);
  expect(handler.exportMasterSeed(walletPassword)).toBe(walletMasterSeed);
  expect(() => handler.exportMasterSeed('wrong password')).toThrow();
  const wallet = handler.getCurrentWallet();
  if (wallet) {
    wallet.encryptedMasterSeed = undefined;
    db.wallets.update(wallet.data);
    expect(() => handler.exportMasterSeed(walletPassword)).toThrow();
  }
});

test('test WalletHandler with unsupported version', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  const wallet = await handler.createWallet(walletMasterSeed, walletPassword);
  wallet.version = undefined;
  db.wallets.update(wallet.data);
  expect(handler.getCurrentWallet()).toBe(undefined);
});
