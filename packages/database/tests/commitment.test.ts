import { toDecimals } from '@mystikonetwork/utils';
import { CommitmentStatus, initDatabase, MystikoDatabase } from '../src';

let db: MystikoDatabase;

beforeEach(async () => {
  db = await initDatabase();
});

afterEach(async () => {
  await db.remove();
});

test('test insert', async () => {
  const now = new Date().toISOString();
  await db.commitments.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '1234',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
  });
  const commitment = await db.commitments.findOne('1').exec();
  if (commitment != null) {
    expect(commitment.id).toBe('1');
    expect(commitment.createdAt).toBe(now);
    expect(commitment.updatedAt).toBe(now);
    expect(commitment.chainId).toBe(3);
    expect(commitment.contractAddress).toBe('0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707');
    expect(commitment.commitmentHash).toBe('1234');
    expect(commitment.assetSymbol).toBe('ETH');
    expect(commitment.assetDecimals).toBe(18);
    expect(commitment.assetAddress).toBe(undefined);
    expect(commitment.assetAddress).toBe(undefined);
    expect(commitment.status).toBe(CommitmentStatus.SRC_SUCCEEDED);
    expect(commitment.simpleAmount()).toBe(undefined);
    expect(commitment.rollupFeeSimpleAmount()).toBe(undefined);
  } else {
    throw new Error('cannot find commitment');
  }
});

test('test insert full', async () => {
  const now = new Date().toISOString();
  await db.commitments.insert({
    id: '2',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '6789',
    assetSymbol: 'mETH',
    assetDecimals: 6,
    assetAddress: '0x39e68dd41AF6Fd870f27a6B77cBcfFA64626b0f3',
    status: CommitmentStatus.SPENT,
    rollupFeeAmount: toDecimals(2, 6).toString(),
    leafIndex: '34',
    encryptedNote: 'deadbeef',
    amount: toDecimals(10, 6).toString(),
    serialNumber: '343243',
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    creationTransactionHash: '0x5b78a656ef8cc070639cdf1cc486ffb7e2cbd8f0354b221a671d2eb17157b8a3',
    spendingTransactionHash: '0x3190d660a6555a36caa841205c1c5140513654f44133ca9dd87d6a1149307e9a',
    rollupTransactionHash: '0x75abe0a3f8bbadb2e2cd52957afc5a0aa72fdb30ec6059e1181c82f3cf23284c',
  });
  const commitment = await db.commitments.findOne('2').exec();
  if (commitment != null) {
    expect(commitment.id).toBe('2');
    expect(commitment.createdAt).toBe(now);
    expect(commitment.updatedAt).toBe(now);
    expect(commitment.chainId).toBe(3);
    expect(commitment.contractAddress).toBe('0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707');
    expect(commitment.commitmentHash).toBe('6789');
    expect(commitment.assetSymbol).toBe('mETH');
    expect(commitment.assetDecimals).toBe(6);
    expect(commitment.assetAddress).toBe('0x39e68dd41AF6Fd870f27a6B77cBcfFA64626b0f3');
    expect(commitment.status).toBe(CommitmentStatus.SPENT);
    expect(commitment.rollupFeeAmount).toBe(toDecimals(2, 6).toString());
    expect(commitment.rollupFeeSimpleAmount()).toBe(2);
    expect(commitment.leafIndex).toBe('34');
    expect(commitment.encryptedNote).toBe('deadbeef');
    expect(commitment.amount).toBe(toDecimals(10, 6).toString());
    expect(commitment.simpleAmount()).toBe(10);
    expect(commitment.serialNumber).toBe('343243');
    expect(commitment.shieldedAddress).toBe(
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    );
    expect(commitment.spendingTransactionHash).toBe(
      '0x3190d660a6555a36caa841205c1c5140513654f44133ca9dd87d6a1149307e9a',
    );
    expect(commitment.rollupTransactionHash).toBe(
      '0x75abe0a3f8bbadb2e2cd52957afc5a0aa72fdb30ec6059e1181c82f3cf23284c',
    );
  } else {
    throw new Error('cannot find commitment');
  }
});

test('test collection clear', async () => {
  const now = new Date().toISOString();
  await db.commitments.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '1234',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
  });
  expect(await db.commitments.findOne().exec()).not.toBe(null);
  await db.commitments.clear();
  expect(await db.commitments.findOne().exec()).toBe(null);
});
