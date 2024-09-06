import { MystikoConfig } from '@mystikonetwork/config';
import { createError, MystikoContext, MystikoErrorCode, WalletHandlerV2 } from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContext;
let handler: WalletHandlerV2;

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
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
  await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  const wallet = await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  expect(await handler.checkCurrent()).toStrictEqual(wallet);
});

test('test checkPassword', async () => {
  await expect(handler.checkPassword('P@ssw0rd')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.WRONG_PASSWORD),
  );
  await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  await handler.checkPassword('P@ssw0rd');
  await expect(handler.checkPassword('wrong')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
});

test('test create', async () => {
  await expect(handler.create({ masterSeed: '', password: 'P@ssw0rd' })).rejects.toThrow(
    createError('masterSeed should be a valid hexadecimal string', MystikoErrorCode.INVALID_MASTER_SEED),
  );
  await expect(handler.create({ masterSeed: 'seed', password: 'P@ssw0rd' })).rejects.toThrow(
    createError('masterSeed should be a valid hexadecimal string', MystikoErrorCode.INVALID_MASTER_SEED),
  );
  await expect(handler.create({ masterSeed: 'deadbeef', password: 'too simple' })).rejects.toThrow(
    createError(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD),
  );
  const wallet = await handler.create({
    masterSeed: 'deadbeef',
    password: 'P@ssw0rd',
    fullSynchronization: true,
  });
  expect(wallet.accountNonce).toBe(0);
  expect(wallet.fullSynchronization).toBe(true);
});

test('test current', async () => {
  expect(await handler.current()).toBe(null);
  let wallet = await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  expect(await handler.current()).toStrictEqual(wallet);
  wallet = await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  expect(await handler.current()).toStrictEqual(wallet);
});

test('test exportMasterSeed', async () => {
  await expect(handler.exportMasterSeed('P@ssw0rd')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
  await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  await expect(handler.exportMasterSeed('wrong password')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
  expect(await handler.exportMasterSeed('P@ssw0rd')).toBe('deadbeef');
});

test('test updatePassword', async () => {
  await expect(handler.updatePassword('P@ssw0rd', 'newP@ssword')).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
  await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  await expect(handler.updatePassword('wrong password', 'newP@ssword')).rejects.toThrow(
    createError('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD),
  );
  await expect(handler.updatePassword('P@ssw0rd', 'invalid password')).rejects.toThrow(
    createError(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD),
  );
  await handler.updatePassword('P@ssw0rd', 'newP@ssw0rd');
  await handler.checkPassword('newP@ssw0rd');
  expect(await handler.exportMasterSeed('newP@ssw0rd')).toBe('deadbeef');
  const wallet = await handler.current();
  expect(wallet).not.toBe(null);
  if (wallet != null) {
    expect(wallet.updatedAt > wallet.createdAt).toBe(true);
  }
});

test('test setFullSynchronization', async () => {
  const wallet = await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  expect(wallet.fullSynchronization).toBe(false);
  await handler.fullSynchronization(true);
  const updatedWallet = await handler.checkCurrent();
  expect(updatedWallet.fullSynchronization).toBe(true);
});

test('test fullSynchronizationOptions', async () => {
  const wallet = await handler.create({ masterSeed: 'deadbeef', password: 'P@ssw0rd' });
  const defaultOptions = await handler.getFullSynchronizationOptions();
  expect(defaultOptions).toStrictEqual({
    chains: [
      { chainId: 5, name: 'Ethereum Goerli', assets: [], enabled: false },
      {
        chainId: 97,
        name: 'BSC Testnet',
        assets: [
          { assetSymbol: 'BNB', enabled: false },
          { assetSymbol: 'MTT', enabled: false },
          { assetSymbol: 'mUSD', enabled: false },
        ],
        enabled: false,
      },
      { chainId: 43113, name: 'Avalanche Testnet', assets: [], enabled: false },
      { chainId: 80001, name: 'Polygon Testnet', assets: [], enabled: false },
      {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        assets: [
          { assetSymbol: 'mBNB', enabled: false },
          { assetSymbol: 'MTT', enabled: false },
          { assetSymbol: 'mUSD', enabled: false },
        ],
        enabled: false,
      },
    ],
  });
  await wallet.atomicUpdate((data) => {
    data.fullSynchronizationOptions = 'wrong serialized options';
    return data;
  });
  expect(await handler.getFullSynchronizationOptions()).toStrictEqual(defaultOptions);
  await handler.setFullSynchronizationOptions({
    chains: [
      {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        assets: [
          { assetSymbol: 'MTT', enabled: true },
          { assetSymbol: 'USDT', enabled: true },
        ],
        enabled: true,
      },
      {
        chainId: 84532,
        name: 'Base Sepolia',
        assets: [{ assetSymbol: 'ETH', enabled: true }],
        enabled: true,
      },
    ],
  });
  const options = await handler.getFullSynchronizationOptions();
  expect(options).toStrictEqual({
    chains: [
      { chainId: 5, name: 'Ethereum Goerli', assets: [], enabled: false },
      {
        chainId: 97,
        name: 'BSC Testnet',
        assets: [
          { assetSymbol: 'BNB', enabled: false },
          { assetSymbol: 'MTT', enabled: false },
          { assetSymbol: 'mUSD', enabled: false },
        ],
        enabled: false,
      },
      { chainId: 43113, name: 'Avalanche Testnet', assets: [], enabled: false },
      { chainId: 80001, name: 'Polygon Testnet', assets: [], enabled: false },
      {
        chainId: 84532,
        name: 'Base Sepolia',
        assets: [{ assetSymbol: 'ETH', enabled: true }],
        enabled: true,
      },
      {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        assets: [
          { assetSymbol: 'mBNB', enabled: false },
          { assetSymbol: 'MTT', enabled: true },
          { assetSymbol: 'mUSD', enabled: false },
          { assetSymbol: 'USDT', enabled: true },
        ],
        enabled: true,
      },
    ],
  });
});
