import { initDatabase, MystikoDatabase } from '../src';

let db: MystikoDatabase;
let now: string;

beforeEach(async () => {
  now = new Date().toISOString();
  db = await initDatabase();
});

afterEach(async () => {
  await db.remove();
});

test('test insert', async () => {
  await db.contracts.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    type: 'deposit',
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    disabled: 1,
    syncStart: 10,
    syncSize: 10000,
    syncedBlockNumber: 100,
    checkedLeafIndex: 200,
  });
  const contract = await db.contracts.findOne('1').exec();
  if (contract) {
    expect(contract.createdAt).toBe(now);
    expect(contract.updatedAt).toBe(now);
    expect(contract.type).toBe('deposit');
    expect(contract.chainId).toBe(3);
    expect(contract.contractAddress).toBe('0x67d4a81096dFD5869bC520f16ae2537aF3dE582D');
    expect(contract.syncStart).toBe(10);
    expect(contract.syncSize).toBe(10000);
    expect(contract.syncedBlockNumber).toBe(100);
    expect(contract.checkedLeafIndex).toBe(200);
  } else {
    throw new Error('contract not found');
  }
});

test('test collection clear', async () => {
  await db.contracts.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    type: 'deposit',
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    disabled: 1,
    syncStart: 10,
    syncSize: 10000,
    syncedBlockNumber: 100,
  });
  expect(await db.contracts.findOne().exec()).not.toBe(null);
  await db.contracts.clear();
  expect(await db.contracts.findOne().exec()).toBe(null);
});
