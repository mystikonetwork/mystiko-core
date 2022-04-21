import { initDatabase, MystikoDatabase, Wallet } from '../src';

let db: MystikoDatabase;
let wallet: Wallet;

beforeEach(async () => {
  db = await initDatabase();
  wallet = await db.wallets.insert({
    id: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hashedPassword: 'deadbeef',
    encryptedMasterSeed: 'deadbeef',
    accountNonce: 1,
  });
});

afterEach(async () => {
  await db.remove();
});

test('test insert', async () => {
  const now = new Date().toISOString();
  await db.chains.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    chainName: 'Ethereum Ropsten',
    providers: ['https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    syncSize: 200000,
    wallet: wallet.id,
  });
  const chain = await db.chains.findOne('1').exec();
  if (chain) {
    expect(chain.createdAt).toBe(now);
    expect(chain.updatedAt).toBe(now);
    expect(chain.chainId).toBe(3);
    expect(chain.chainName).toBe('Ethereum Ropsten');
    expect(chain.providers).toStrictEqual(['https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161']);
    expect(chain.syncSize).toBe(200000);
    const populatedWallet: Wallet = await chain.populate('wallet');
    expect(populatedWallet).toStrictEqual(wallet);
  } else {
    throw new Error('chain not found');
  }
});

test('test collection clear', async () => {
  const now = new Date().toISOString();
  await db.chains.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    chainName: 'Ethereum Ropsten',
    providers: ['https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    syncSize: 200000,
    wallet: wallet.id,
  });
  expect(await db.chains.findOne().exec()).not.toBe(null);
  await db.chains.clear();
  expect(await db.chains.findOne().exec()).toBe(null);
});
