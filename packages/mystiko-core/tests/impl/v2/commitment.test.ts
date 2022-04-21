import { BridgeType } from '@mystikonetwork/config';
import { Account, Commitment, CommitmentStatus } from '@mystikonetwork/database';
import {
  AccountHandlerV2,
  CommitmentHandlerV2,
  MystikoContext,
  MystikoHandler,
  WalletHandlerV2,
} from '../../../src';
import { createTestContext } from './context';

function createCommitment(
  chainId: number,
  contractAddress: string,
  assetSymbol: string,
  commitmentHash: string,
  shieldedAddress?: string,
  bridgeType?: BridgeType,
  status?: CommitmentStatus,
  srcChainId?: number,
  srcContractAddress?: string,
  srcAssetSymbol?: string,
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
    bridgeType: bridgeType || BridgeType.LOOP,
    commitmentHash,
    status: status || CommitmentStatus.SRC_SUCCEEDED,
    srcChainId: srcChainId || chainId,
    srcChainContractAddress: srcContractAddress || contractAddress,
    srcAssetSymbol: srcAssetSymbol || assetSymbol,
    srcAssetDecimals: 18,
    shieldedAddress,
  } as Commitment;
}

let context: MystikoContext;
let handler: CommitmentHandlerV2;
let walletHandler: WalletHandlerV2;
let accountHandler: AccountHandlerV2;
let account1: Account;
let account2: Account;
const walletMasterSeed = 'masterSeed';
const walletPassword = 'P@ssw0rd';

beforeAll(async () => {
  context = await createTestContext();
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
      BridgeType.LOOP,
      CommitmentStatus.QUEUED,
    ),
    createCommitment(
      3,
      '0x5709faB0715f1BcBd6Ac007d2c574982baCFb71D',
      'MTT',
      '3',
      account1.shieldedAddress,
      BridgeType.CELER,
      CommitmentStatus.SPENT,
      97,
      '0x809Ec2d363e9969b9725657FbED1c79FbC92de6B',
    ),
    createCommitment(
      97,
      '0xc759D7D753862550e5e25Dc21B2AA83526290eEB',
      'BNB',
      '4',
      account2.shieldedAddress,
      BridgeType.TBRIDGE,
      CommitmentStatus.INCLUDED,
      3,
      '0x1d462FA75d1526014f4Ceaf170Cc286309AC759E',
      'mBNB',
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

test('test findByAssetAndBridge', async () => {
  let commitments = await handler.findByAssetAndBridge({
    chainId: 3,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.LOOP,
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['2']);
  commitments = await handler.findByAssetAndBridge({
    chainId: 3,
    assetSymbol: 'ETH',
    bridgeType: BridgeType.LOOP,
    shieldedAddresses: [account1.shieldedAddress, account2.shieldedAddress],
  });
  expect(commitments.length).toBe(0);
  commitments = await handler.findByAssetAndBridge({
    chainId: 97,
    assetSymbol: 'BNB',
    bridgeType: BridgeType.TBRIDGE,
    statuses: [CommitmentStatus.INCLUDED],
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['4']);
  commitments = await handler.findByAssetAndBridge({
    chainId: 97,
    assetSymbol: 'BNB',
    bridgeType: BridgeType.TBRIDGE,
    shieldedAddresses: [account1.shieldedAddress, account2.shieldedAddress],
    statuses: [CommitmentStatus.INCLUDED],
  });
  expect(commitments.map((c) => c.commitmentHash).sort()).toStrictEqual(['4']);
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
});
