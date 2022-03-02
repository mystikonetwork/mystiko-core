import { AssetType, BridgeType, MystikoConfig, readFromFile } from '@mystiko/config';
import { ContractHandler, createDatabase, MystikoDatabase } from '../../src';

let db: MystikoDatabase;
let config: MystikoConfig;
let contractHandler: ContractHandler;

beforeEach(async () => {
  db = await createDatabase('test.db');
  config = await readFromFile('tests/config/config.test.json');
  contractHandler = new ContractHandler(db, config);
});

afterEach(() => {
  db.database.close();
});

test('test importFromConfig', async () => {
  db.contracts.insert({
    chainId: 1,
    address: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    assetDecimals: 10,
  });
  await contractHandler.importFromConfig();
  expect(contractHandler.getContracts().length).toBe(8);
  expect(contractHandler.getContract(1, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879')?.assetDecimals).toBe(
    18,
  );
  expect(contractHandler.getContract(1, '0x98ed94360cad67a76a53d8aa15905e52485b73d1')?.assetSymbol).toBe(
    'USDT',
  );
  expect(contractHandler.getContract(1, '0x8fb1df17768e29c936edfbce1207ad13696268b7')?.bridgeType).toBe(
    BridgeType.POLY,
  );
  expect(contractHandler.getContract(56, '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67')?.assetType).toBe(
    AssetType.ERC20,
  );
});

test('test getContracts', async () => {
  await contractHandler.importFromConfig();
  let contracts = contractHandler.getContracts({
    filterFunc: (contract) => contract.bridgeType === BridgeType.POLY && contract.chainId === 56,
  });
  expect(contracts.length).toBe(1);
  expect(contracts[0].address).toBe('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  contracts = contractHandler.getContracts({ sortBy: 'assetSymbol' });
  expect(contracts.length).toBe(8);
  expect(contracts[0].address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  contracts = contractHandler.getContracts({ sortBy: 'assetType', desc: true });
  expect(contracts.length).toBe(8);
  expect(contracts[0].assetType).toBe(AssetType.MAIN);
  contracts = contractHandler.getContracts({ offset: 2, limit: 2 });
  expect(contracts.length).toBe(2);
});

test('test updateSyncedBlock', async () => {
  await contractHandler.importFromConfig();
  await contractHandler.updateSyncedBlock(1, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879', 1024);
  const contract = contractHandler.getContract(1, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(contract?.syncedBlock).toBe(1024);
  await contractHandler.updateSyncedBlock(100, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879', 1024);
});
