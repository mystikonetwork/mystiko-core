// eslint-disable-next-line max-classes-per-file
import { BridgeType, MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, TransactionEnum, TransactionStatus } from '@mystikonetwork/database';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import { readJsonFile } from '@mystikonetwork/utils';
import {
  AccountHandlerV2,
  CommitmentHandlerV2,
  createError,
  ExecutorFactoryV2,
  MystikoContextInterface,
  MystikoErrorCode,
  TransactionExecutorV2,
  TransactionHandlerV2,
  TransactionOptions,
  TransactionResponse,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let handler: TransactionHandlerV2;

class TestTransactionExecutor extends TransactionExecutorV2 {
  public async execute(): Promise<TransactionResponse> {
    const transactions = await this.context.transactions.find();
    const [transaction] = transactions;
    return Promise.resolve({ transaction, transactionPromise: Promise.resolve(transaction) });
  }
}

class TestExecutorFactory extends ExecutorFactoryV2 {
  public getTransactionExecutor(): TransactionExecutorV2 {
    return new TestTransactionExecutor(this.context);
  }
}

async function getTransactionOptions(): Promise<TransactionOptions> {
  const signer = new PrivateKeySigner(context.config, context.providers);
  const account = (await context.accounts.find())[0];
  return Promise.resolve({
    walletPassword: 'P@assw0rd',
    type: TransactionEnum.TRANSFER,
    chainId: 3,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    shieldedAddress: account.shieldedAddress,
    amount: 6,
    rollupFee: 0.1,
    signer,
  });
}

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  context.wallets = new WalletHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
  context.commitments = new CommitmentHandlerV2(context);
  context.executors = new TestExecutorFactory(context);
  handler = new TransactionHandlerV2(context);
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
  expect(count).toBe(2);
  count = await handler.count({ selector: { chainId: 3 } });
  expect(count).toBe(1);
});

test('test create', async () => {
  const options = await getTransactionOptions();
  await handler.create(options);
  options.chainId = 1024;
  await expect(handler.create(options)).rejects.toThrow(
    createError(
      'invalid transaction options, no corresponding contract found',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
});

test('test find', async () => {
  let transactions = await handler.find();
  expect(transactions.length).toBe(2);
  transactions = await handler.find({ selector: { chainId: 97 } });
  expect(transactions.length).toBe(1);
  const wallet = await context.wallets.checkCurrent();
  await wallet.remove();
  await expect(handler.find()).rejects.toThrow(
    createError('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET),
  );
});

test('test findOne', async () => {
  let transactions = await handler.find({ selector: { id: '01G1Z2ZQKB4X46H3JZQ406F3WA' } });
  const [expected] = transactions;
  transactions = await handler.find({ selector: { id: '01G1Z2WCR95GZG9FQQ0N6VWGQ3' } });
  const [notExpected] = transactions;
  let transaction = await handler.findOne(expected.id);
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  transaction = await handler.findOne({ id: expected.id });
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  transaction = await handler.findOne({
    chainId: expected.chainId,
    transactionHash: expected.transactionHash,
  });
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  transaction = await handler.findOne({
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    serialNumber: expected.serialNumbers ? expected.serialNumbers[0] : undefined,
  });
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  expect(transaction?.id).not.toBe(notExpected.id);
  transaction = await handler.findOne({
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    inputCommitmentId: expected.inputCommitments ? expected.inputCommitments[0] : undefined,
  });
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  expect(transaction?.id).not.toBe(notExpected.id);
  transaction = await handler.findOne({
    chainId: expected.chainId,
    contractAddress: expected.contractAddress,
    outputCommitmentId: expected.outputCommitments ? expected.outputCommitments[0] : undefined,
  });
  expect(transaction?.toJSON()).toStrictEqual(expected.toJSON());
  expect(transaction?.id).not.toBe(notExpected.id);
  transaction = await handler.findOne('not a valid id');
  expect(transaction).toBe(null);
});

test('test quote', async () => {
  const options = await getTransactionOptions();
  expect(await handler.quote(options)).not.toBe(undefined);
  options.chainId = 2048;
  await expect(handler.quote(options)).rejects.toThrow(
    createError(
      'invalid transaction options, no corresponding contract found',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});

test('test summary', async () => {
  const options = await getTransactionOptions();
  expect(await handler.summary(options)).not.toBe(undefined);
  options.chainId = 2048;
  await expect(handler.summary(options)).rejects.toThrow(
    createError(
      'invalid transaction options, no corresponding contract found',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});

test('test update', async () => {
  await expect(handler.update('wrong id', {})).rejects.toThrow(
    createError('no transaction found for query=wrong id', MystikoErrorCode.NON_EXISTING_DEPOSIT),
  );
  const transactions = await handler.find();
  const [transaction] = transactions;
  const previousUpdatedAt = transaction.updatedAt;
  let updatedTransaction = await handler.update(transaction.id, {});
  expect(updatedTransaction.updatedAt).toBe(previousUpdatedAt);
  updatedTransaction = await handler.update(transaction.id, {
    status: transaction.status as TransactionStatus,
    errorMessage: transaction.errorMessage,
    transactionHash: transaction.transactionHash,
  });
  expect(updatedTransaction.updatedAt).toBe(previousUpdatedAt);
  const testErrorMessage = 'test error message';
  const testTxHash = '0x2ac5b74d83336e88dd795f47d0b2884c10c6b3fbf8e5d619db99488ad093a027';
  updatedTransaction = await handler.update(transaction.id, {
    status: TransactionStatus.FAILED,
    errorMessage: testErrorMessage,
    transactionHash: testTxHash,
  });
  expect(new Date(updatedTransaction.updatedAt).getTime()).toBeGreaterThan(
    new Date(previousUpdatedAt).getTime(),
  );
  expect(updatedTransaction.status).toBe(TransactionStatus.FAILED);
  expect(updatedTransaction.errorMessage).toBe(testErrorMessage);
  expect(updatedTransaction.transactionHash).toBe(testTxHash);
});
