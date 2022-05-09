import { DepositContractConfig, MystikoConfig } from '@mystikonetwork/config';
import { initDatabase } from '@mystikonetwork/database';
import { ContractHandlerV2, MystikoContextInterface } from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let handler: ContractHandlerV2;

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  handler = new ContractHandlerV2(context);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
});

afterAll(async () => {
  await context.db.remove();
});

test('test init', async () => {
  const contracts = await handler.init();
  contracts.forEach((contract) => {
    const configuredContract =
      context.config
        .getChainConfig(contract.chainId)
        ?.getDepositContractByAddress(contract.contractAddress) ||
      context.config.getChainConfig(contract.chainId)?.getPoolContractByAddress(contract.contractAddress);
    expect(contract.type).toBe(configuredContract?.type);
    expect(contract.disabled === 1).toBe(
      configuredContract instanceof DepositContractConfig ? configuredContract.disabled : false,
    );
    expect(contract.syncStart).toBe(configuredContract?.startBlock);
    expect(contract.syncSize).toBe(
      context.config.getChainConfig(contract.chainId)?.getEventFilterSizeByAddress(contract.contractAddress),
    );
    expect(contract.syncedBlockNumber).toBe(contract.syncStart);
  });
  expect((await handler.find()).length).toBe(contracts.length);
});

test('test init upsert', async () => {
  await handler.init();
  const totalNumber = (await handler.find()).length;
  const rawConfig = context.config.copyData();
  const rawContractConfig = rawConfig.chains[2].depositContracts[0];
  rawContractConfig.eventFilterSize = 1024;
  rawContractConfig.disabled = true;
  const newContext = await createTestContext({
    config: await MystikoConfig.createFromRaw(rawConfig),
    db: context.db,
  });
  const newHandler = new ContractHandlerV2(newContext);
  await newHandler.init();
  const contract = await newHandler.findOne({
    chainId: rawConfig.chains[2].chainId,
    address: rawContractConfig.address,
  });
  expect(contract?.disabled).toBe(1);
  expect(contract?.syncSize).toBe(1024);
  expect((await newHandler.find()).length).toBe(totalNumber);
});

test('test contract find', async () => {
  const allContracts = await handler.init();
  let contracts = await handler.find();
  expect(contracts.length).toBe(allContracts.length);
  contracts = await handler.find({ selector: { chainId: 1024 } });
  expect(contracts.length).toBe(0);
});

test('test contract findOne', async () => {
  const allContracts = await handler.init();
  let contract = await handler.findOne({ chainId: 1024, address: allContracts[0].contractAddress });
  expect(contract).toBe(null);
  contract = await handler.findOne({
    chainId: allContracts[0].chainId,
    address: allContracts[0].contractAddress,
  });
  expect(contract?.toJSON()).toStrictEqual(allContracts[0].toJSON());
  contract = await handler.findOne(allContracts[0].id);
  expect(contract?.toJSON()).toStrictEqual(allContracts[0].toJSON());
});
