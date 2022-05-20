import { initDatabase, MystikoDatabase } from '../src';

let db: MystikoDatabase;

beforeEach(async () => {
  db = await initDatabase();
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
    name: 'Ethereum Ropsten',
    providers: [
      {
        url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        timeoutMs: 1000,
        maxTryCount: 2,
      },
    ],
    eventFilterSize: 200000,
    syncedBlockNumber: 100,
  });
  const chain = await db.chains.findOne('1').exec();
  if (chain) {
    expect(chain.createdAt).toBe(now);
    expect(chain.updatedAt).toBe(now);
    expect(chain.chainId).toBe(3);
    expect(chain.name).toBe('Ethereum Ropsten');
    expect(chain.providers).toStrictEqual([
      {
        url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        timeoutMs: 1000,
        maxTryCount: 2,
      },
    ]);
    expect(chain.eventFilterSize).toBe(200000);
    expect(chain.syncedBlockNumber).toBe(100);
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
    name: 'Ethereum Ropsten',
    providers: [
      {
        url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        timeoutMs: 1000,
        maxTryCount: 2,
      },
    ],
    providerOverride: 0,
    eventFilterSize: 200000,
    syncedBlockNumber: 100,
  });
  expect(await db.chains.findOne().exec()).not.toBe(null);
  await db.chains.clear();
  expect(await db.chains.findOne().exec()).toBe(null);
});
