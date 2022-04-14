import { toDecimals } from '@mystikonetwork/utils';
import { DepositStatus, initDatabase, MystikoDatabase, Wallet } from '../src';

let db: MystikoDatabase;
let wallet: Wallet;
let now: string;

beforeAll(async () => {
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
});

afterAll(async () => {
  await db.destroy();
});

test('test insert', async () => {
  await db.deposits.insert({
    id: '1',
    createdAt: now,
    updatedAt: now,
    chainId: 3,
    contractAddress: '0x67d4a81096dFD5869bC520f16ae2537aF3dE582D',
    commitmentHash: '1234',
    assetSymbol: 'MTT',
    assetDecimals: 18,
    assetAddress: '0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88',
    bridgeType: 'tbridge',
    amount: toDecimals(123, 18).toString(),
    rollupFeeAmount: toDecimals(1, 18).toString(),
    bridgeFeeAmount: toDecimals(2, 18).toString(),
    executorFeeAmount: toDecimals(3, 18).toString(),
    shieldedRecipientAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    status: DepositStatus.QUEUED,
    errorMessage: 'error',
    wallet: wallet.id,
    dstChainId: 97,
    dstChainContractAddress: '0x80525A2C863107210e0208D60e2694949914c26A',
    assetApproveTransactionHash: '0xcfacd2092217c92cd89abfd4aed43b13c797423523ccebc49aac99aa9051deaa',
    transactionHash: '0x67709f4ce1e2c1c670b8b87954fad9d1e682da12eba85dd6d5378e8d778ad50b',
    relayTransactionHash: '0xf170874dfe57215baf907d857bd3fbc87ab6fa4488909df0a1cde91a11dfb470',
    rollupTransactionHash: '0x564fd2a3ced91565be2b0082a73fb3b7eaa894f357a6f9cf148d8d8b31ea2fd2',
  });
  const deposit = await db.deposits.findOne('1').exec();
  if (deposit) {
    expect(deposit.createdAt).toBe(now);
    expect(deposit.updatedAt).toBe(now);
    expect(deposit.chainId).toBe(3);
    expect(deposit.contractAddress).toBe('0x67d4a81096dFD5869bC520f16ae2537aF3dE582D');
    expect(deposit.commitmentHash).toBe('1234');
    expect(deposit.assetSymbol).toBe('MTT');
    expect(deposit.assetDecimals).toBe(18);
    expect(deposit.assetAddress).toBe('0x6BCdf8B9aD00F2f6a1EA1F537d27DdF92eF99f88');
    expect(deposit.bridgeType).toBe('tbridge');
    expect(deposit.amount).toBe(toDecimals(123, 18).toString());
    expect(deposit.simpleAmount()).toBe(123);
    expect(deposit.rollupFeeAmount).toBe(toDecimals(1, 18).toString());
    expect(deposit.rollupFeeSimpleAmount()).toBe(1);
    expect(deposit.bridgeFeeAmount).toBe(toDecimals(2, 18).toString());
    expect(deposit.bridgeFeeSimpleAmount()).toBe(2);
    expect(deposit.executorFeeAmount).toBe(toDecimals(3, 18).toString());
    expect(deposit.executorFeeSimpleAmount()).toBe(3);
    expect(deposit.shieldedRecipientAddress).toBe(
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
    );
    expect(deposit.status).toBe(DepositStatus.QUEUED);
    expect(deposit.errorMessage).toBe('error');
    expect(deposit.dstChainId).toBe(97);
    expect(deposit.dstChainContractAddress).toBe('0x80525A2C863107210e0208D60e2694949914c26A');
    expect(deposit.assetApproveTransactionHash).toBe(
      '0xcfacd2092217c92cd89abfd4aed43b13c797423523ccebc49aac99aa9051deaa',
    );
    expect(deposit.transactionHash).toBe(
      '0x67709f4ce1e2c1c670b8b87954fad9d1e682da12eba85dd6d5378e8d778ad50b',
    );
    expect(deposit.relayTransactionHash).toBe(
      '0xf170874dfe57215baf907d857bd3fbc87ab6fa4488909df0a1cde91a11dfb470',
    );
    expect(deposit.rollupTransactionHash).toBe(
      '0x564fd2a3ced91565be2b0082a73fb3b7eaa894f357a6f9cf148d8d8b31ea2fd2',
    );
    const populatedWallet = await deposit.populate('wallet');
    expect(populatedWallet).toStrictEqual(wallet);
  } else {
    throw new Error('deposit not found');
  }
});
