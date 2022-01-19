import { WalletHandler } from '../../src/handler/walletHandler.js';
import { createDatabase } from '../../src/database.js';

let handler;
let db;

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
  expect(wallet.protocol.decryptSymmetric(walletPassword, wallet.encryptedMasterSeed)).toBe(walletMasterSeed);
  expect(wallet.hashedPassword).toBe(wallet.protocol.checkSum(walletPassword));
  expect(wallet.accountNonce).toBe(0);
  expect(handler.getCurrentWallet().toString()).toBe(wallet.toString());
  expect(handler.getWalletById(wallet.id).toString()).toBe(wallet.toString());
  expect(handler.checkPassword(walletPassword)).toBe(true);
  expect(handler.checkPassword('wrong')).toBe(false);
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
  const wallet = await handler.createWallet(walletMasterSeed, walletPassword);
  expect(await handler.updatePassword('wrong', 'new')).toBe(false);
  const newPassword = 'newP@ssw0rd';
  expect(await handler.updatePassword(walletPassword, newPassword)).toBe(true);
  expect(handler.checkPassword(newPassword)).toBe(true);
  expect(wallet.protocol.decryptSymmetric(newPassword, wallet.encryptedMasterSeed)).toBe(walletMasterSeed);
});
