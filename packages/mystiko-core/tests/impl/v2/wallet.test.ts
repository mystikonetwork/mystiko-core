import { createError, MystikoErrorCode, WalletHandlerV2 } from '../../../src';
import { MystikoContext } from '../../../src/context';
import { createTestContext } from './context';

let context: MystikoContext;
let handler: WalletHandlerV2;

beforeAll(async () => {
  context = await createTestContext();
});

beforeEach(() => {
  handler = new WalletHandlerV2(context);
});

afterEach(async () => {
  await context.db.wallets.clear();
});

afterAll(async () => {
  await context.db.remove();
});

test('test checkCurrent', async () => {
  await expect(handler.checkCurrent()).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
  await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  const wallet = await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  expect(await handler.checkCurrent()).toStrictEqual(wallet);
});

test('test checkPassword', async () => {
  await expect(handler.checkPassword('P@ssw0rd')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.WRONG_PASSWORD),
  );
  await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  await handler.checkPassword('P@ssw0rd');
  await expect(handler.checkPassword('wrong')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
});

test('test create', async () => {
  await expect(handler.create({ masterSeed: '', password: 'P@ssw0rd' })).rejects.toThrow(
    createError('masterSeed cannot be empty string', MystikoErrorCode.INVALID_MASTER_SEED),
  );
  await expect(handler.create({ masterSeed: 'seed', password: 'too simple' })).rejects.toThrow(
    createError(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD),
  );
  const wallet = await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  expect(wallet.accountNonce).toBe(0);
});

test('test current', async () => {
  expect(await handler.current()).toBe(null);
  let wallet = await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  expect(await handler.current()).toStrictEqual(wallet);
  wallet = await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  expect(await handler.current()).toStrictEqual(wallet);
});

test('test exportMasterSeed', async () => {
  await expect(handler.exportMasterSeed('P@ssw0rd')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
  await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  await expect(handler.exportMasterSeed('wrong password')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
  expect(await handler.exportMasterSeed('P@ssw0rd')).toBe('seed');
});

test('test updatePassword', async () => {
  await expect(handler.updatePassword('P@ssw0rd', 'newP@ssword')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
  await handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' });
  await expect(handler.updatePassword('wrong password', 'newP@ssword')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
  await handler.updatePassword('P@ssw0rd', 'newP@ssw0rd');
  await handler.checkPassword('newP@ssw0rd');
  expect(await handler.exportMasterSeed('newP@ssw0rd')).toBe('seed');
  const wallet = await handler.current();
  expect(wallet).not.toBe(null);
  if (wallet != null) {
    expect(wallet.updatedAt > wallet.createdAt).toBe(true);
  }
});
