import { WalletHandler } from '../../src/handler/walletHandler.js';
import { Handler } from '../../src/handler/handler.js';
import { createDatabase } from '../../src/database.js';

let handler;
let db;

beforeEach(async () => {
  db = await createDatabase('test.db', true);
  handler = new WalletHandler(db);
});

afterEach(() => {
  db.database.close();
});

test('Test WalletHandler createWallet', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  const wallet = await handler.createWallet(walletMasterSeed, walletPassword);
  expect(Handler.aesDecrypt(wallet.encryptedMasterSeed, walletPassword)).toBe(walletMasterSeed);
  expect(wallet.hashedPassword).toBe(Handler.hmacSHA512(walletPassword));
  expect(wallet.accountNonce).toBe(0);
  expect(handler.getCurrentWallet().toString()).toBe(wallet.toString());
  expect(handler.getWalletById(wallet.id).toString()).toBe(wallet.toString());
  expect(handler.checkPassword(wallet, walletPassword)).toBe(true);
  expect(handler.checkPassword(wallet, 'wrong')).toBe(false);
});

test('Test WalletHandler getCurrentWallet', async () => {
  expect(handler.getCurrentWallet()).toBe(null);
});

test('Test WalletHandler getWallet by id', async () => {
  expect(handler.getWalletById(1)).toBe(null);
});

test('Test WalletHandler updatePassword', async () => {
  const walletMasterSeed = 'awesomeMasterSeed';
  const walletPassword = 'P@ssw0rd';
  const wallet = await handler.createWallet(walletMasterSeed, walletPassword);
  expect(await handler.updatePassword(wallet, 'wrong', 'new')).toBe(false);
  const newPassword = 'newP@ssw0rd';
  expect(await handler.updatePassword(wallet, walletPassword, newPassword)).toBe(true);
  expect(handler.checkPassword(wallet, newPassword)).toBe(true);
  expect(Handler.aesDecrypt(wallet.encryptedMasterSeed, newPassword)).toBe(walletMasterSeed);
});
