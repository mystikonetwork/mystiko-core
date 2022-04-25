import { toDecimals } from '@mystikonetwork/utils';
import {
  Commitment,
  CommitmentStatus,
  initDatabase,
  MystikoDatabase,
  TransactionEnum,
  TransactionStatus,
  Wallet,
} from '../src';

let db: MystikoDatabase;
let wallet: Wallet;
let now: string;
let commitment1: Commitment;
let commitment2: Commitment;
let commitment3: Commitment;
let commitment4: Commitment;

beforeEach(async () => {
  now = new Date().toISOString();
  db = await initDatabase();
  wallet = await db.wallets.insert({
    id: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hashedPassword: 'deadbeef',
    encryptedMasterSeed: 'deadbeef',
    accountNonce: 1,
  });
  commitment1 = await db.commitments.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '1234',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
    creationTransactionHash: '0xb39b0bd04360c17ba5ff321b0f4a3a0724d5cb2b126add5e4afbed3bcd08f4a5',
    rollupFeeAmount: toDecimals(1, 18).toString(),
  });
  commitment2 = await db.commitments.insert({
    id: '2',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '2345',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
    creationTransactionHash: '0xb39b0bd04360c17ba5ff321b0f4a3a0724d5cb2b126add5e4afbed3bcd08f4a5',
    amount: toDecimals(10, 18).toString(),
  });
  commitment3 = await db.commitments.insert({
    id: '3',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '3456',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
    creationTransactionHash: '0xb39b0bd04360c17ba5ff321b0f4a3a0724d5cb2b126add5e4afbed3bcd08f4a5',
    rollupFeeAmount: toDecimals(2, 18).toString(),
  });
  commitment4 = await db.commitments.insert({
    id: '4',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0xF90F38aE5c12442e8A3DAc8FD310F15D2A75A707',
    commitmentHash: '4567',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    status: CommitmentStatus.SRC_SUCCEEDED,
    creationTransactionHash: '0xb39b0bd04360c17ba5ff321b0f4a3a0724d5cb2b126add5e4afbed3bcd08f4a5',
    amount: toDecimals(20, 18).toString(),
  });
});

afterEach(async () => {
  await db.remove();
});

test('test insert', async () => {
  await db.transactions.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    assetSymbol: 'MTT',
    assetDecimals: 18,
    assetAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    proof: 'abc',
    rootHash: '123456',
    inputCommitments: ['1', '2'],
    outputCommitments: ['3', '4'],
    serialNumbers: ['444', '555'],
    signaturePublicKey: 'deadbeef',
    signaturePublicKeyHashes: ['12345'],
    amount: toDecimals(234, 18).toString(),
    publicAmount: toDecimals(123, 18).toString(),
    rollupFeeAmount: toDecimals(15, 18).toString(),
    gasRelayerFeeAmount: toDecimals(13, 18).toString(),
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    publicAddress: '0x80525A2C863107210e0208D60e2694949914c26A',
    gasRelayerAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    signature: 'baadbeef',
    type: TransactionEnum.WITHDRAW,
    status: TransactionStatus.SUCCEEDED,
    errorMessage: 'error',
    transactionHash: '0x67709f4ce1e2c1c670b8b87954fad9d1e682da12eba85dd6d5378e8d778ad50b',
    wallet: wallet.id,
  });
  const transaction = await db.transactions.findOne('1').exec();
  if (transaction) {
    expect(transaction.createdAt).toBe(now);
    expect(transaction.updatedAt).toBe(now);
    expect(transaction.chainId).toBe(3);
    expect(transaction.contractAddress).toBe('0x67d4a81096dFD5869bC520f16ae2537aF3dE582D');
    expect(transaction.assetSymbol).toBe('MTT');
    expect(transaction.assetDecimals).toBe(18);
    expect(transaction.assetAddress).toBe('0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88');
    expect(transaction.proof).toBe('abc');
    expect(transaction.rootHash).toBe('123456');
    expect(transaction.serialNumbers).toStrictEqual(['444', '555']);
    expect(transaction.signaturePublicKey).toBe('deadbeef');
    expect(transaction.signaturePublicKeyHashes).toStrictEqual(['12345']);
    expect(await transaction.inputAmount()).toBe(toDecimals(10, 18).toString());
    expect(await transaction.inputSimpleAmount()).toBe(10);
    expect(transaction.rollupFeeAmount).toBe(toDecimals(15, 18).toString());
    expect(transaction.simpleRollupFeeAmount()).toBe(15);
    expect(transaction.amount).toBe(toDecimals(234, 18).toString());
    expect(transaction.simpleAmount()).toBe(234);
    expect(transaction.publicAmount).toBe(toDecimals(123, 18).toString());
    expect(transaction.simplePublicAmount()).toBe(123);
    expect(transaction.gasRelayerFeeAmount).toBe(toDecimals(13, 18).toString());
    expect(transaction.simpleGasRelayerFeeAmount()).toBe(13);
    expect(transaction.shieldedAddress).toBe(
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    );
    expect(transaction.publicAddress).toBe('0x80525A2C863107210e0208D60e2694949914c26A');
    expect(transaction.gasRelayerAddress).toBe('0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88');
    expect(transaction.signature).toBe('baadbeef');
    expect(transaction.type).toBe(TransactionEnum.WITHDRAW);
    expect(transaction.status).toBe(TransactionStatus.SUCCEEDED);
    expect(transaction.errorMessage).toBe('error');
    expect(transaction.transactionHash).toBe(
      '0x67709f4ce1e2c1c670b8b87954fad9d1e682da12eba85dd6d5378e8d778ad50b',
    );
    const populatedWallet: Wallet = await transaction.populate('wallet');
    expect(populatedWallet).toStrictEqual(wallet);
    const inputCommitments: Commitment[] = await transaction.populate('inputCommitments');
    expect(inputCommitments).toStrictEqual([commitment1, commitment2]);
    const outputCommitments: Commitment[] = await transaction.populate('outputCommitments');
    expect(outputCommitments).toStrictEqual([commitment3, commitment4]);
  } else {
    throw new Error('transaction not found');
  }
});

test('test collection clear', async () => {
  await db.transactions.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    assetSymbol: 'MTT',
    assetDecimals: 18,
    assetAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    proof: 'abc',
    rootHash: '123456',
    inputCommitments: ['1', '2'],
    outputCommitments: ['3', '4'],
    signaturePublicKey: 'deadbeef',
    signaturePublicKeyHashes: ['12345'],
    amount: toDecimals(234, 18).toString(),
    publicAmount: toDecimals(123, 18).toString(),
    rollupFeeAmount: toDecimals(15, 18).toString(),
    gasRelayerFeeAmount: toDecimals(13, 18).toString(),
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    publicAddress: '0x80525A2C863107210e0208D60e2694949914c26A',
    gasRelayerAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    signature: 'baadbeef',
    type: TransactionEnum.WITHDRAW,
    status: TransactionStatus.SUCCEEDED,
    errorMessage: 'error',
    transactionHash: '0x67709f4ce1e2c1c670b8b87954fad9d1e682da12eba85dd6d5378e8d778ad50b',
    wallet: wallet.id,
  });
  expect(await db.transactions.findOne().exec()).not.toBe(null);
  await db.transactions.clear();
  expect(await db.transactions.findOne().exec()).toBe(null);
});
