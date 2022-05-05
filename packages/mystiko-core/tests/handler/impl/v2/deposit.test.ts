// eslint-disable-next-line max-classes-per-file
import { BridgeType, DepositContractConfig, MystikoConfig } from '@mystikonetwork/config';
import { DepositStatus, initDatabase } from '@mystikonetwork/database';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import { readJsonFile } from '@mystikonetwork/utils';
import {
  AccountHandlerV2,
  createError,
  DepositExecutorV2,
  DepositHandlerV2,
  DepositOptions,
  DepositResponse,
  ExecutorFactoryV2,
  MystikoContextInterface,
  MystikoErrorCode,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let handler: DepositHandlerV2;

class TestDepositExecutor extends DepositExecutorV2 {
  public async execute(): Promise<DepositResponse> {
    const deposits = await this.context.deposits.find();
    return Promise.resolve({ deposit: deposits[0], depositPromise: Promise.resolve(deposits[0]) });
  }
}

class TestExecutorFactory extends ExecutorFactoryV2 {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getDepositExecutor(config: DepositContractConfig): DepositExecutorV2 {
    return new TestDepositExecutor(this.context);
  }
}

async function getDepositOptions(): Promise<DepositOptions> {
  const signer = new PrivateKeySigner(context.config, context.providers);
  const account = (await context.accounts.find())[0];
  return Promise.resolve({
    srcChainId: 3,
    dstChainId: 97,
    assetSymbol: 'MTT',
    bridge: BridgeType.TBRIDGE,
    amount: 10,
    rollupFee: 1,
    bridgeFee: 0.01,
    executorFee: 0.1,
    shieldedAddress: account.shieldedAddress,
    signer,
  });
}

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  context.wallets = new WalletHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
  handler = new DepositHandlerV2(context);
  context.executors = new TestExecutorFactory(context);
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

test('test count', async () => {
  let count = await handler.count();
  expect(count).toBe(5);
  count = await handler.count({ selector: { chainId: 3 } });
  expect(count).toBe(1);
});

test('test create', async () => {
  const options = await getDepositOptions();
  await handler.create(options);
  options.srcChainId = 1024;
  await expect(handler.create(options)).rejects.toThrow(
    createError(
      'invalid deposit options, no corresponding contract found',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});

test('test find', async () => {
  let deposits = await handler.find();
  expect(deposits.length).toBe(5);
  deposits = await handler.find({ selector: { chainId: 97 } });
  expect(deposits.length).toBe(4);
  const wallet = await context.wallets.checkCurrent();
  await wallet.remove();
  await expect(handler.find()).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
});

test('test findOne', async () => {
  const deposits = await handler.find();
  const [expected] = deposits;
  let deposit = await handler.findOne(expected.id);
  expect(deposit?.toJSON()).toStrictEqual(expected.toJSON());
  deposit = await handler.findOne({ id: expected.id });
  expect(deposit?.toJSON()).toStrictEqual(expected.toJSON());
  deposit = await handler.findOne({ chainId: expected.chainId, transactionHash: expected.transactionHash });
  expect(deposit?.toJSON()).toStrictEqual(expected.toJSON());
  deposit = await handler.findOne({
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    commitmentHash: expected.commitmentHash,
  });
  expect(deposit?.toJSON()).toStrictEqual(expected.toJSON());
  deposit = await handler.findOne('not a valid id');
  expect(deposit).toBe(null);
});

test('test quote', async () => {
  const options = await getDepositOptions();
  expect(await handler.quote(options)).not.toBe(undefined);
  options.srcChainId = 2048;
  await expect(handler.quote(options)).rejects.toThrow(
    createError(
      'invalid deposit options, no corresponding contract found',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});

test('test update', async () => {
  await expect(handler.update('wrong id', {})).rejects.toThrow(
    createError('no deposit found for query=wrong id', MystikoErrorCode.NON_EXISTING_DEPOSIT),
  );
  const deposits = await handler.find();
  const [deposit] = deposits;
  const previousUpdatedAt = deposit.updatedAt;
  let updatedDeposit = await handler.update(deposit.id, {});
  expect(updatedDeposit.updatedAt).toBe(previousUpdatedAt);
  updatedDeposit = await handler.update(deposit.id, {
    status: deposit.status as DepositStatus,
    errorMessage: deposit.errorMessage,
    transactionHash: deposit.transactionHash,
    relayTransactionHash: deposit.relayTransactionHash,
    rollupTransactionHash: deposit.rollupTransactionHash,
    assetApproveTransactionHash: deposit.assetApproveTransactionHash,
  });
  expect(updatedDeposit.updatedAt).toBe(previousUpdatedAt);
  const testErrorMessage = 'test error message';
  const testTxHash = '0x2ac5b74d83336e88dd795f47d0b2884c10c6b3fbf8e5d619db99488ad093a027';
  updatedDeposit = await handler.update(deposit.id, {
    status: DepositStatus.FAILED,
    errorMessage: testErrorMessage,
    transactionHash: testTxHash,
    relayTransactionHash: testTxHash,
    rollupTransactionHash: testTxHash,
    assetApproveTransactionHash: testTxHash,
  });
  expect(new Date(updatedDeposit.updatedAt).getTime()).toBeGreaterThan(new Date(previousUpdatedAt).getTime());
  expect(updatedDeposit.status).toBe(DepositStatus.FAILED);
  expect(updatedDeposit.errorMessage).toBe(testErrorMessage);
  expect(updatedDeposit.transactionHash).toBe(testTxHash);
  expect(updatedDeposit.relayTransactionHash).toBe(testTxHash);
  expect(updatedDeposit.rollupTransactionHash).toBe(testTxHash);
  expect(updatedDeposit.assetApproveTransactionHash).toBe(testTxHash);
});

test('test summary', async () => {
  const options = await getDepositOptions();
  expect(await handler.summary(options)).not.toBe(undefined);
  options.srcChainId = 2048;
  await expect(handler.summary(options)).rejects.toThrow(
    createError(
      'invalid deposit options, no corresponding contract found',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});
