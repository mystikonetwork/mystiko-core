// eslint-disable-next-line max-classes-per-file
import { Account, Commitment, CommitmentStatus } from '@mystikonetwork/database';
import {
  AccountHandlerV2,
  CommitmentExecutorV2,
  CommitmentHandlerV2,
  ExecutorFactoryV2,
  MystikoContext,
  MystikoHandler,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

function createCommitment(
  chainId: number,
  contractAddress: string,
  assetSymbol: string,
  commitmentHash: string,
  shieldedAddress?: string,
  status?: CommitmentStatus,
): Commitment {
  const now = MystikoHandler.now();
  return {
    id: MystikoHandler.generateId(),
    createdAt: now,
    updatedAt: now,
    chainId,
    contractAddress,
    assetSymbol,
    assetDecimals: 18,
    commitmentHash,
    status: status || CommitmentStatus.SRC_SUCCEEDED,
    shieldedAddress,
  } as Commitment;
}

let context: MystikoContext;
let handler: CommitmentHandlerV2;
let walletHandler: WalletHandlerV2;
let accountHandler: AccountHandlerV2;
let account1: Account;
let account2: Account;
const walletMasterSeed = '0xdeadbeef';
const walletPassword = 'P@ssw0rd';

class TestCommitmentExecutor extends CommitmentExecutorV2 {
  public import(): Promise<Commitment[]> {
    return Promise.resolve([]);
  }

  public scan(): Promise<Commitment[]> {
    return Promise.resolve([]);
  }
}

class TestExecutorFactory extends ExecutorFactoryV2 {
  public getCommitmentExecutor(): CommitmentExecutorV2 {
    return new TestCommitmentExecutor(this.context);
  }
}

beforeAll(async () => {
  context = await createTestContext();
  context.executors = new TestExecutorFactory(context);
});

beforeEach(async () => {
  handler = new CommitmentHandlerV2(context);
  walletHandler = new WalletHandlerV2(context);
  accountHandler = new AccountHandlerV2(context);
  await walletHandler.create({ masterSeed: walletMasterSeed, password: walletPassword });
  account1 = await accountHandler.create(walletPassword);
  account2 = await accountHandler.create(walletPassword);
  await context.db.commitments.bulkInsert([
    createCommitment(3, '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D', 'ETH', '1'),
    createCommitment(
      3,
      '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
      'MTT',
      '2',
      account1.shieldedAddress,
      CommitmentStatus.QUEUED,
    ),
    createCommitment(
      3,
      '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
      'MTT',
      '3',
      account1.shieldedAddress,
      CommitmentStatus.SPENT,
    ),
    createCommitment(
      97,
      '0xc759D7D753862550e5e25Dc21B2AA83526290eEB',
      'BNB',
      '4',
      account2.shieldedAddress,
      CommitmentStatus.INCLUDED,
    ),
  ]);
});

afterEach(async () => {
  await context.db.accounts.clear();
  await context.db.wallets.clear();
  await context.db.commitments.clear();
});

afterAll(async () => {
  await context.db.remove();
});

test('test find', async () => {
  expect((await handler.find()).length).toBe(4);
  const commitments = await handler.find({ selector: { shieldedAddress: account2.shieldedAddress } });
  expect(commitments.length).toBe(1);
  expect(commitments[0].commitmentHash).toBe('4');
});

test('test findByContract', async () => {
  let commitments = await handler.findByContract({
    chainId: 3,
    contractAddress: '0x76cf9b3148d907f80d0a8567ed47c3fa971bbcc9',
  });
  expect(commitments.length).toBe(0);
  commitments = await handler.findByContract({
    chainId: 97,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
  });
  expect(commitments.length).toBe(0);
  commitments = await handler.findByContract({
    chainId: 3,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['1', '2', '3']);
  commitments = await handler.findByContract({
    chainId: 97,
    contractAddress: '0xc759D7D753862550e5e25Dc21B2AA83526290eEB',
    shieldedAddresses: [account2.shieldedAddress],
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['4']);
  commitments = await handler.findByContract({
    chainId: 3,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
    statuses: [CommitmentStatus.SRC_SUCCEEDED, CommitmentStatus.QUEUED],
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['1', '2']);
  commitments = await handler.findByContract({
    chainId: 3,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
    shieldedAddresses: [account1.shieldedAddress, account2.shieldedAddress],
    statuses: [CommitmentStatus.SRC_SUCCEEDED, CommitmentStatus.QUEUED],
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['2']);
});

test('test findOne', async () => {
  let commitment = await handler.findOne({
    chainId: 3,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
    commitmentHash: '100',
  });
  expect(commitment).toBe(null);
  commitment = await handler.findOne({
    chainId: 3,
    contractAddress: '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
    commitmentHash: '2',
  });
  expect(commitment).not.toBe(null);
  if (commitment) {
    const newCommitment = await handler.findOne(commitment.id);
    expect(newCommitment?.toJSON()).toStrictEqual(commitment.toJSON());
  }
});

test('test import', async () => {
  await handler.import({ walletPassword });
});

test('test scan', async () => {
  await handler.scan({ walletPassword, shieldedAddress: account1.shieldedAddress });
});
