import { initDatabase, MystikoDatabase } from '../src';

let db: MystikoDatabase;
let now: string;

beforeAll(async () => {
  now = new Date().toISOString();
  db = await initDatabase();
});

afterAll(async () => {
  await db.destroy();
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
    syncedBlockNumber: 100
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
  } else {
    throw new Error('contract not found');
  }
});
