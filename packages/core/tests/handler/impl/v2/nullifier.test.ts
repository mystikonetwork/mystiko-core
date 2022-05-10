import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, NullifierType } from '@mystikonetwork/database';
import { readJsonFile } from '@mystikonetwork/utils';
import { MystikoContextInterface, MystikoHandler } from '../../../../src';
import { NullifierHandlerV2 } from '../../../../src/handler/impl/v2/nullifier';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let handler: NullifierHandlerV2;

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  handler = new NullifierHandlerV2(context);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  const dbData = await readJsonFile('tests/files/database.sync.test.json');
  await context.db.importJSON(dbData);
});

afterAll(async () => {
  await context.db.remove();
});

test('test find', async () => {
  let nullifiers = await handler.find();
  expect(nullifiers.length).toBe(44);
  nullifiers = await handler.find({ selector: { chainId: 97 } });
  expect(nullifiers.length).toBe(42);
  nullifiers = await handler.find({ selector: { chainId: 3 } });
  expect(nullifiers.length).toBe(2);
});

test('test findOne', async () => {
  const nullifiers = await handler.find();
  const [expected] = nullifiers;
  let nullifier = await handler.findOne(expected.id);
  expect(nullifier?.toJSON()).toStrictEqual(expected.toJSON());
  nullifier = await handler.findOne({
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    serialNumber: expected.serialNumber,
  });
  expect(nullifier?.toJSON()).toStrictEqual(expected.toJSON());
  nullifier = await handler.findOne('not a valid id');
  expect(nullifier).toBe(null);
});

test('test upsert', async () => {
  const nullifiers = await handler.find();
  const [expected] = nullifiers;
  const now = MystikoHandler.now();
  const data: NullifierType = {
    id: MystikoHandler.generateId(),
    createdAt: now,
    updatedAt: now,
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    serialNumber: expected.serialNumber,
    transactionHash: '0x5230b92b53b3074f09b976cdb5742c1ccfc127e02bf6e42d5b46b5c4f0016598',
  };
  await handler.upsert(data);
  expect(expected.updatedAt).toBe(now);
  expect(expected.transactionHash).toBe('0x5230b92b53b3074f09b976cdb5742c1ccfc127e02bf6e42d5b46b5c4f0016598');
  data.serialNumber = '1234';
  const another = await handler.upsert(data);
  expect(another.id).not.toBe(expected.id);
  expect((await handler.find()).length).toBe(45);
});
