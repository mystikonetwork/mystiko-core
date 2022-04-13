import { CircuitEnum, initDatabase, MystikoClientDatabase } from '../src';

let db: MystikoClientDatabase;

beforeAll(async () => {
  db = await initDatabase();
});

afterAll(async () => {
  await db.destroy();
});

test('test insert', async () => {
  const now = new Date().toISOString();
  await db.circuits.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    name: 'zokrates-2.0-transaction1x0',
    type: CircuitEnum.TRANSACTION1X0,
    programFiles: ['./Transaction1x0.program.gz'],
    abiFiles: ['./Transaction1x0.abi.json'],
    provingKeyFiles: ['./Transaction1x0.pkey.gz'],
    verifyingKeyFiles: ['./Transaction1x0.vkey.gz'],
  });
  const circuit = await db.circuits.findOne('1').exec();
  if (circuit) {
    expect(circuit.createdAt).toBe(now);
    expect(circuit.updatedAt).toBe(now);
    expect(circuit.name).toBe('zokrates-2.0-transaction1x0');
    expect(circuit.type).toBe(CircuitEnum.TRANSACTION1X0);
    expect(circuit.programFiles).toStrictEqual(['./Transaction1x0.program.gz']);
    expect(circuit.abiFiles).toStrictEqual(['./Transaction1x0.abi.json']);
    expect(circuit.provingKeyFiles).toStrictEqual(['./Transaction1x0.pkey.gz']);
    expect(circuit.verifyingKeyFiles).toStrictEqual(['./Transaction1x0.vkey.gz']);
  } else {
    throw new Error('circuit not found');
  }
});

test('test insert errors', async () => {
  const now = new Date().toISOString();
  await expect(
    db.circuits.insert({
      id: '2',
      createdAt: now,
      updatedAt: now,
      name: 'zokrates-2.0-transaction1x0',
      type: CircuitEnum.TRANSACTION1X0,
      programFiles: [],
      abiFiles: ['./Transaction1x0.abi.json'],
      provingKeyFiles: ['./Transaction1x0.pkey.gz'],
      verifyingKeyFiles: ['./Transaction1x0.vkey.gz'],
    }),
  ).rejects.toThrow();
  await expect(
    db.circuits.insert({
      id: '2',
      createdAt: now,
      updatedAt: now,
      name: 'zokrates-2.0-transaction1x0',
      type: CircuitEnum.TRANSACTION1X0,
      programFiles: ['./Transaction1x0.program.gz'],
      abiFiles: [],
      provingKeyFiles: ['./Transaction1x0.pkey.gz'],
      verifyingKeyFiles: ['./Transaction1x0.vkey.gz'],
    }),
  ).rejects.toThrow();
  await expect(
    db.circuits.insert({
      id: '2',
      createdAt: now,
      updatedAt: now,
      name: 'zokrates-2.0-transaction1x0',
      type: CircuitEnum.TRANSACTION1X0,
      programFiles: ['./Transaction1x0.program.gz'],
      abiFiles: ['./Transaction1x0.abi.json'],
      provingKeyFiles: [],
      verifyingKeyFiles: ['./Transaction1x0.vkey.gz'],
    }),
  ).rejects.toThrow();
  await expect(
    db.circuits.insert({
      id: '2',
      createdAt: now,
      updatedAt: now,
      name: 'zokrates-2.0-transaction1x0',
      type: CircuitEnum.TRANSACTION1X0,
      programFiles: ['./Transaction1x0.program.gz'],
      abiFiles: ['./Transaction1x0.abi.json'],
      provingKeyFiles: ['./Transaction1x0.pkey.gz'],
      verifyingKeyFiles: [],
    }),
  ).rejects.toThrow();
});
