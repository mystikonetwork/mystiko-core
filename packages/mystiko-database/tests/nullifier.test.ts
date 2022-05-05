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
  await db.nullifiers.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    serialNumber: '1234',
    transactionHash: '0xe53c1586b284074fab9b062f089efe89c1135fbbb0af68a54c88a886e6b9a4ad',
  });
  const nullifier = await db.nullifiers.findOne('1').exec();
  if (nullifier != null) {
    expect(nullifier.id).toBe('1');
    expect(nullifier.createdAt).toBe(now);
    expect(nullifier.updatedAt).toBe(now);
    expect(nullifier.chainId).toBe(3);
    expect(nullifier.contractAddress).toBe('0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707');
    expect(nullifier.serialNumber).toBe('1234');
    expect(nullifier.transactionHash).toBe(
      '0xe53c1586b284074fab9b062f089efe89c1135fbbb0af68a54c88a886e6b9a4ad',
    );
  } else {
    throw new Error('cannot find commitment');
  }
});

test('test collection clear', async () => {
  const now = new Date().toISOString();
  await db.nullifiers.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    serialNumber: '1234',
    transactionHash: '0xe53c1586b284074fab9b062f089efe89c1135fbbb0af68a54c88a886e6b9a4ad',
  });
  expect(await db.nullifiers.findOne().exec()).not.toBe(null);
  await db.nullifiers.clear();
  expect(await db.nullifiers.findOne().exec()).toBe(null);
});
