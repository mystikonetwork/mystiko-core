import { Circuit, CircuitEnum, initDatabase, MystikoClientDatabase } from '../src';

let db: MystikoClientDatabase;
let circuit: Circuit;
let now: string;

beforeAll(async () => {
  now = new Date().toISOString();
  db = await initDatabase();
  circuit = await db.circuits.insert({
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
});

afterAll(async () => {
  await db.destroy();
});

test('test insert', async () => {
  await db.contracts.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    assetSymbol: 'MTT',
    assetDecimals: 18,
    assetAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    bridgeType: 'loop',
    peerChainId: 97,
    peerContractAddress: '0x80525A2C863107210e0208D60e2694949914c26A',
    minRollupFeeAmount: '1',
    minBridgeFeeAmount: '2',
    minExecutorFeeAmount: '3',
    depositDisabled: 1,
    syncStart: 10,
    syncSize: 10000,
    syncedBlockNumber: 100,
    circuits: ['1'],
  });
  const contract = await db.contracts.findOne('1').exec();
  if (contract) {
    expect(contract.createdAt).toBe(now);
    expect(contract.updatedAt).toBe(now);
    expect(contract.chainId).toBe(3);
    expect(contract.contractAddress).toBe('0x67d4a81096dFD5869bC520f16ae2537aF3dE582D');
    expect(contract.assetSymbol).toBe('MTT');
    expect(contract.assetDecimals).toBe(18);
    expect(contract.assetAddress).toBe('0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88');
    expect(contract.bridgeType).toBe('loop');
    expect(contract.peerChainId).toBe(97);
    expect(contract.peerContractAddress).toBe('0x80525A2C863107210e0208D60e2694949914c26A');
    expect(contract.minRollupFeeAmount).toBe('1');
    expect(contract.minBridgeFeeAmount).toBe('2');
    expect(contract.minExecutorFeeAmount).toBe('3');
    expect(contract.depositDisabled).toBe(1);
    expect(contract.syncStart).toBe(10);
    expect(contract.syncSize).toBe(10000);
    expect(contract.syncedBlockNumber).toBe(100);
    const circuits: Circuit[] = await contract.populate('circuits');
    expect(circuits).toStrictEqual([circuit]);
  } else {
    throw new Error('contract not found');
  }
});
