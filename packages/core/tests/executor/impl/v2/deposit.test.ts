import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { MockProvider } from '@ethereum-waffle/provider';
import { BridgeType, DepositContractConfig, MAIN_ASSET_ADDRESS, MystikoConfig } from '@mystikonetwork/config';
import {
  CommitmentPool__factory,
  ERC20__factory,
  MystikoContractFactory,
  MystikoV2Bridge__factory,
  MystikoV2Loop__factory,
  SupportedContractType,
} from '@mystikonetwork/contracts-abi';
import {
  Account,
  CommitmentStatus,
  Deposit,
  DepositStatus,
  initDatabase,
  Wallet,
} from '@mystikonetwork/database';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import { fromDecimals, toDecimals } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
  CommitmentHandlerV2,
  createError,
  DepositExecutorV2,
  DepositHandlerV2,
  DepositOptions,
  MystikoContextInterface,
  MystikoErrorCode,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let config: MystikoConfig;
let context: MystikoContextInterface;
let walletHandler: WalletHandlerV2;
let accountHandler: AccountHandlerV2;
let depositHandler: DepositHandlerV2;
let commitmentHandler: CommitmentHandlerV2;
let executor: DepositExecutorV2;
let mockERC20: MockContract;
let mockMystikoV2Loop: MockContract;
let mockMystikoV2Bridge: MockContract;
let mockCommitmentPool: MockContract;
let mockProvider: MockProvider;
let etherWallet: ethers.Wallet;
let mystikoWallet: Wallet;
let mystikoAccount: Account;
let mystikoSigner: PrivateKeySigner;
const walletPassword = 'P@ssw0rd';
const walletMasterSeed = 'deadbeefbaadbabe';

async function getDepositContractConfig(
  srcChainId: number,
  dstChainId: number,
  assetSymbol: string,
  bridge: BridgeType,
): Promise<DepositContractConfig> {
  const depositContractConfig = config.getDepositContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
  if (!depositContractConfig) {
    throw new Error('depositContractConfig should not be undefined');
  }
  await mockCommitmentPool.mock.getMinRollupFee.returns(depositContractConfig.minRollupFee.toString());
  return depositContractConfig;
}

type TestOptions = {
  options: DepositOptions;
  depositContractConfig: DepositContractConfig;
};

async function createTestOptionsAndConfig(): Promise<TestOptions> {
  const depositContractConfig = await getDepositContractConfig(11155111, 97, 'MTT', BridgeType.TBRIDGE);
  const options: DepositOptions = {
    srcChainId: 11155111,
    dstChainId: 97,
    assetSymbol: 'MTT',
    bridge: BridgeType.TBRIDGE,
    amount: 10,
    rollupFee: 1,
    bridgeFee: 0.01,
    executorFee: 0.1,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
  };
  return { options, depositContractConfig };
}

async function checkDeposit(
  deposit: Deposit,
  options: DepositOptions,
  depositContractConfig: DepositContractConfig,
) {
  expect(deposit.chainId).toBe(options.srcChainId);
  expect(deposit.contractAddress).toBe(depositContractConfig.address);
  expect(deposit.poolAddress).toBe(depositContractConfig.poolAddress);
  expect(deposit.bridgeType).toBe(depositContractConfig.bridgeType);
  expect(deposit.dstChainId).toBe(depositContractConfig.peerChainId || options.srcChainId);
  expect(deposit.dstChainContractAddress).toBe(
    depositContractConfig.peerContractAddress || depositContractConfig.address,
  );
  expect(deposit.dstPoolAddress).toBe(
    depositContractConfig.peerContract?.poolAddress || depositContractConfig.poolAddress,
  );
  expect(deposit.assetSymbol).toBe(depositContractConfig.assetSymbol);
  expect(deposit.assetDecimals).toBe(depositContractConfig.assetDecimals);
  expect(deposit.assetAddress).toBe(depositContractConfig.assetAddress);
  expect(deposit.simpleAmount()).toBe(options.amount);
  expect(deposit.rollupFeeSimpleAmount()).toBe(options.rollupFee);
  expect(deposit.bridgeFeeSimpleAmount()).toBe(options.bridgeFee || 0);
  expect(deposit.bridgeFeeAssetAddress).toBe(depositContractConfig.bridgeFeeAsset.assetAddress);
  expect(deposit.executorFeeSimpleAmount()).toBe(options.executorFee || 0);
  expect(deposit.executorFeeAssetAddress).toBe(depositContractConfig.executorFeeAsset.assetAddress);
  expect(deposit.serviceFeeSimpleAmount()).toBe(
    (options.amount * depositContractConfig.serviceFee) / depositContractConfig.serviceFeeDivider,
  );
  expect(deposit.shieldedRecipientAddress).toBe(options.shieldedAddress);
  expect(deposit.hashK).not.toBe(undefined);
  expect(deposit.randomS).not.toBe(undefined);
  expect(deposit.status).toBe(
    options.bridge === BridgeType.LOOP ? DepositStatus.QUEUED : DepositStatus.SRC_SUCCEEDED,
  );
  expect(deposit.errorMessage).toBe(undefined);
  expect(deposit.wallet).toBe(mystikoWallet.id);
  expect(deposit.transactionHash).not.toBe(undefined);
  expect((await depositHandler.findOne(deposit.id))?.toJSON()).toStrictEqual(deposit.toJSON());
  const commitment = await commitmentHandler.findOne({
    chainId: deposit.dstChainId,
    contractAddress: deposit.dstPoolAddress,
    commitmentHash: deposit.commitmentHash,
  });
  expect(commitment?.status).toBe(
    options.bridge === BridgeType.LOOP ? CommitmentStatus.QUEUED : CommitmentStatus.SRC_SUCCEEDED,
  );
  expect(commitment?.assetSymbol).toBe(
    depositContractConfig.peerContract?.assetSymbol || depositContractConfig.assetSymbol,
  );
  expect(commitment?.assetDecimals).toBe(
    depositContractConfig.peerContract?.assetDecimals || depositContractConfig.assetDecimals,
  );
  expect(commitment?.assetAddress).toBe(
    depositContractConfig.peerContract
      ? depositContractConfig.peerContract.assetAddress
      : depositContractConfig.assetAddress,
  );
  expect(commitment?.encryptedNote).toBe(deposit.encryptedNote);
  expect(commitment?.amount).toBe(deposit.amount);
  expect(commitment?.rollupFeeAmount).toBe(deposit.rollupFeeAmount);
  expect(commitment?.shieldedAddress).toBe(deposit.shieldedRecipientAddress);
  if (deposit.bridgeType === BridgeType.LOOP) {
    expect(commitment?.creationTransactionHash).toBe(deposit.transactionHash);
  } else {
    expect(commitment?.creationTransactionHash).toBe(undefined);
  }
}

beforeAll(async () => {
  etherWallet = ethers.Wallet.createRandom();
  mockProvider = new MockProvider({
    ganacheOptions: {
      accounts: [{ balance: toDecimals(1), secretKey: etherWallet.privateKey }],
    },
  });
  const [signer] = mockProvider.getWallets();
  config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  context = await createTestContext({
    config,
    providerFactory: {
      createProvider(): ethers.providers.Provider {
        return mockProvider;
      },
    },
    contractConnector: {
      connect<T extends SupportedContractType>(contractName: string): T {
        if (contractName === 'ERC20') {
          return MystikoContractFactory.connect<T>(contractName, mockERC20.address, signer);
        }
        if (contractName === 'CommitmentPool') {
          return MystikoContractFactory.connect<T>(contractName, mockCommitmentPool.address, signer);
        }
        if (contractName === 'MystikoV2Loop') {
          return MystikoContractFactory.connect<T>(contractName, mockMystikoV2Loop.address, signer);
        }
        return MystikoContractFactory.connect<T>(contractName, mockMystikoV2Bridge.address, signer);
      },
    },
  });
  walletHandler = new WalletHandlerV2(context);
  accountHandler = new AccountHandlerV2(context);
  depositHandler = new DepositHandlerV2(context);
  commitmentHandler = new CommitmentHandlerV2(context);
  executor = new DepositExecutorV2(context);
  mystikoSigner = new PrivateKeySigner(config, context.providers);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  mystikoWallet = await walletHandler.create({ password: walletPassword, masterSeed: walletMasterSeed });
  mystikoAccount = await accountHandler.create(walletPassword);
  const [signer] = mockProvider.getWallets();
  mockERC20 = await deployMockContract(signer, ERC20__factory.abi);
  mockMystikoV2Loop = await deployMockContract(signer, MystikoV2Loop__factory.abi);
  mockMystikoV2Bridge = await deployMockContract(signer, MystikoV2Bridge__factory.abi);
  mockCommitmentPool = await deployMockContract(signer, CommitmentPool__factory.abi);
});

afterAll(async () => {
  await context.db.remove();
});

test('test quote', async () => {
  const depositContractConfig = await getDepositContractConfig(11155111, 97, 'MTT', BridgeType.TBRIDGE);
  await mockCommitmentPool.mock.getMinRollupFee.returns(
    depositContractConfig.minRollupFee.muln(2).toString(),
  );
  let quote = await executor.quote(
    { srcChainId: 11155111, dstChainId: 97, assetSymbol: 'MTT', bridge: BridgeType.TBRIDGE },
    depositContractConfig,
  );
  expect(quote).toStrictEqual({
    minAmount: depositContractConfig.minAmountNumber,
    maxAmount: depositContractConfig.maxAmountNumber,
    minRollupFeeAmount: depositContractConfig.minRollupFeeNumber * 2,
    rollupFeeAssetSymbol: depositContractConfig.assetSymbol,
    minBridgeFeeAmount: depositContractConfig.minBridgeFeeNumber,
    bridgeFeeAssetSymbol: depositContractConfig.bridgeFeeAsset.assetSymbol,
    minExecutorFeeAmount: depositContractConfig.minExecutorFeeNumber,
    executorFeeAssetSymbol: depositContractConfig.executorFeeAsset.assetSymbol,
    recommendedAmounts: [1, 10, 100],
  });
  const rawDepositContractConfig = depositContractConfig.copyData();
  rawDepositContractConfig.bridgeFeeAssetAddress = depositContractConfig.assetAddress;
  rawDepositContractConfig.executorFeeAssetAddress = MAIN_ASSET_ADDRESS;
  const newDepositContractConfig = depositContractConfig.mutate(rawDepositContractConfig);
  await mockCommitmentPool.mock.getMinRollupFee.reverts();
  quote = await executor.quote(
    { srcChainId: 11155111, dstChainId: 97, assetSymbol: 'MTT', bridge: BridgeType.TBRIDGE },
    newDepositContractConfig,
  );
  expect(quote).toStrictEqual({
    minAmount: newDepositContractConfig.minAmountNumber,
    maxAmount: newDepositContractConfig.maxAmountNumber,
    minRollupFeeAmount: newDepositContractConfig.minRollupFeeNumber,
    rollupFeeAssetSymbol: newDepositContractConfig.assetSymbol,
    minBridgeFeeAmount: newDepositContractConfig.minBridgeFeeNumber,
    bridgeFeeAssetSymbol: newDepositContractConfig.bridgeFeeAsset.assetSymbol,
    minExecutorFeeAmount: newDepositContractConfig.minExecutorFeeNumber,
    executorFeeAssetSymbol: newDepositContractConfig.executorFeeAsset.assetSymbol,
    recommendedAmounts: [1, 10, 100],
  });
});

test('test summary', async () => {
  const { options, depositContractConfig } = await createTestOptionsAndConfig();
  let summary = await executor.summary(options, depositContractConfig);
  expect(summary.srcChainId).toBe(options.srcChainId);
  expect(summary.dstChainId).toBe(options.dstChainId);
  expect(summary.assetSymbol).toBe(options.assetSymbol);
  expect(summary.bridge).toBe(options.bridge);
  expect(summary.amount).toBe(options.amount);
  expect(summary.rollupFee).toBe(options.rollupFee);
  expect(summary.rollupFeeAssetSymbol).toBe(depositContractConfig.assetSymbol);
  expect(summary.bridgeFee).toBe(options.bridgeFee);
  expect(summary.bridgeFeeAssetSymbol).toBe(depositContractConfig.bridgeFeeAsset.assetSymbol);
  expect(summary.executorFee).toBe(options.executorFee);
  expect(summary.executorFeeAssetSymbol).toBe(depositContractConfig.executorFeeAsset.assetSymbol);
  expect(summary.serviceFeeRatio).toBe(
    depositContractConfig.serviceFee / depositContractConfig.serviceFeeDivider,
  );
  expect(summary.serviceFeeAssetSymbol).toBe(depositContractConfig.assetSymbol);
  expect(summary.serviceFee).toBe(options.amount * summary.serviceFeeRatio);
  expect(summary.totals.sort()).toStrictEqual(
    [
      { assetSymbol: 'MTT', total: 11.11 },
      { assetSymbol: 'ETH', total: 0.01 },
    ].sort(),
  );
  const depositContractConfig1 = await getDepositContractConfig(97, 97, 'MTT', BridgeType.LOOP);
  options.srcChainId = 97;
  options.bridge = BridgeType.LOOP;
  options.bridgeFee = 0;
  options.executorFee = 0;
  summary = await executor.summary(options, depositContractConfig1);
  expect(summary.bridgeFee).toBe(0);
  expect(summary.executorFee).toBe(0);
  expect(summary.totals.sort()).toStrictEqual(
    [
      { assetSymbol: 'MTT', total: 11.01 },
      { assetSymbol: 'BNB', total: 0 },
    ].sort(),
  );
});

test('test invalid options', async () => {
  const { options, depositContractConfig } = await createTestOptionsAndConfig();
  await expect(executor.summary({ ...options, amount: -1 }, depositContractConfig)).rejects.toThrow(
    createError('amount cannot be negative or zero', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, rollupFee: -1 }, depositContractConfig)).rejects.toThrow(
    createError('rollup fee cannot be negative or zero', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, bridgeFee: -1 }, depositContractConfig)).rejects.toThrow(
    createError('bridge fee cannot be negative', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, executorFee: -1 }, depositContractConfig)).rejects.toThrow(
    createError('executor fee cannot be negative', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, srcChainId: 102400 }, depositContractConfig)).rejects.toThrow(
    createError('no chain id=102400 configured', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, srcChainId: 5 }, depositContractConfig)).rejects.toThrow(
    createError('options mismatch with given contract config', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, dstChainId: 5 }, depositContractConfig)).rejects.toThrow(
    createError('options mismatch with given contract config', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(executor.summary({ ...options, assetSymbol: 'BNB' }, depositContractConfig)).rejects.toThrow(
    createError('options mismatch with given contract config', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(
    executor.summary({ ...options, bridge: BridgeType.CELER }, depositContractConfig),
  ).rejects.toThrow(
    createError('options mismatch with given contract config', MystikoErrorCode.INVALID_DEPOSIT_OPTIONS),
  );
  await expect(
    executor.summary({ ...options, shieldedAddress: 'not_an_address' }, depositContractConfig),
  ).rejects.toThrow(
    createError(
      'address not_an_address is an invalid Mystiko address',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...options, amount: 0.01 }, depositContractConfig)).rejects.toThrow(
    createError(
      `deposit amount cannot be less than ${depositContractConfig.minAmountNumber}`,
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...options, amount: 1000000 }, depositContractConfig)).rejects.toThrow(
    createError(
      `deposit amount cannot be greater than ${depositContractConfig.maxAmountNumber}`,
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await mockCommitmentPool.mock.getMinRollupFee.returns(
    depositContractConfig.minRollupFee.divn(10).toString(),
  );
  await expect(executor.summary({ ...options, rollupFee: 0.0001 }, depositContractConfig)).rejects.toThrow(
    createError(
      `rollup fee cannot be less than ${fromDecimals(
        depositContractConfig.minRollupFee.divn(10),
        depositContractConfig.assetDecimals,
      )}`,
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...options, bridgeFee: 0 }, depositContractConfig)).rejects.toThrow(
    createError(
      `bridge fee cannot be less than ${depositContractConfig.minBridgeFeeNumber}`,
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...options, executorFee: 0 }, depositContractConfig)).rejects.toThrow(
    createError(
      `executor fee cannot be less than ${depositContractConfig.minExecutorFeeNumber}`,
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  const depositContractConfig1 = await getDepositContractConfig(97, 97, 'MTT', BridgeType.LOOP);
  await expect(
    executor.summary(
      { ...options, srcChainId: 97, bridge: BridgeType.LOOP, executorFee: 0 },
      depositContractConfig1,
    ),
  ).rejects.toThrow(
    createError(
      'bridge fee should be zero when depositing to loop contract',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
  await expect(
    executor.summary(
      { ...options, srcChainId: 97, bridge: BridgeType.LOOP, bridgeFee: 0 },
      depositContractConfig1,
    ),
  ).rejects.toThrow(
    createError(
      'executor fee should be zero when depositing to loop contract',
      MystikoErrorCode.INVALID_DEPOSIT_OPTIONS,
    ),
  );
});

test('test invalid signer', async () => {
  const { options, depositContractConfig } = await createTestOptionsAndConfig();
  await expect(executor.execute(options, depositContractConfig)).rejects.toThrow(
    new Error('signer has not been connected'),
  );
});

test('test invalid erc20 balance', async () => {
  await mockERC20.mock.balanceOf.returns('0');
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const { options, depositContractConfig } = await createTestOptionsAndConfig();
  await expect(executor.execute(options, depositContractConfig)).rejects.toThrow(
    createError(
      `insufficient balance of asset=MTT on chain id=${options.srcChainId}`,
      MystikoErrorCode.INSUFFICIENT_BALANCE,
    ),
  );
});

test('test invalid main asset balance', async () => {
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const { options, depositContractConfig } = await createTestOptionsAndConfig();
  options.bridgeFee = 2;
  await expect(executor.execute(options, depositContractConfig)).rejects.toThrow(
    createError(
      `insufficient balance of asset=ETH on chain id=${options.srcChainId}`,
      MystikoErrorCode.INSUFFICIENT_BALANCE,
    ),
  );
});

test('test loop main deposit', async () => {
  await mockMystikoV2Loop.mock.deposit.returns();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const depositContractConfig = await getDepositContractConfig(97, 97, 'BNB', BridgeType.LOOP);
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'BNB',
    bridge: BridgeType.LOOP,
    amount: 0.1,
    rollupFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
  expect(deposit.assetApproveTransactionHash).toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(3);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[2][1]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[2][2]).toBe(DepositStatus.QUEUED);
});

test('test loop erc20 deposit', async () => {
  const depositContractConfig = await getDepositContractConfig(97, 97, 'MTT', BridgeType.LOOP);
  await mockMystikoV2Loop.mock.deposit.returns();
  await mockERC20.mock.balanceOf.returns('0');
  await mockERC20.mock.balanceOf.withArgs(etherWallet.address).returns(toDecimals(20).toString());
  await mockERC20.mock.allowance.returns('0');
  await mockERC20.mock.approve.reverts();
  await mockERC20.mock.approve
    .withArgs(depositContractConfig.address, toDecimals(10.11).toString())
    .returns(true);
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'MTT',
    bridge: BridgeType.LOOP,
    amount: 10,
    rollupFee: 0.1,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
  expect(deposit.assetApproveTransactionHash).not.toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(4);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][2]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][1]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][2]).toBe(DepositStatus.QUEUED);
});

test('test loop erc20 deposit without approve', async () => {
  const depositContractConfig = await getDepositContractConfig(97, 97, 'MTT', BridgeType.LOOP);
  await mockMystikoV2Loop.mock.deposit.returns();
  await mockERC20.mock.balanceOf.returns('0');
  await mockERC20.mock.balanceOf.withArgs(etherWallet.address).returns(toDecimals(20).toString());
  await mockERC20.mock.allowance.returns('0');
  await mockERC20.mock.allowance
    .withArgs(etherWallet.address, depositContractConfig.address)
    .returns(toDecimals(10.11).toString());
  await mockERC20.mock.approve.reverts();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'MTT',
    bridge: BridgeType.LOOP,
    amount: 10,
    rollupFee: 0.1,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
  expect(deposit.assetApproveTransactionHash).toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(4);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][2]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][1]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][2]).toBe(DepositStatus.QUEUED);
});

test('test bridge main deposit', async () => {
  const depositContractConfig = await getDepositContractConfig(97, 11155111, 'BNB', BridgeType.TBRIDGE);
  await mockMystikoV2Bridge.mock.deposit.returns();
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 11155111,
    assetSymbol: 'BNB',
    bridge: BridgeType.TBRIDGE,
    amount: 0.1,
    rollupFee: 0.1,
    bridgeFee: 0.01,
    executorFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
  expect(deposit.assetApproveTransactionHash).toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(3);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[2][1]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[2][2]).toBe(DepositStatus.SRC_SUCCEEDED);
});

test('test bridge erc20 deposit', async () => {
  const depositContractConfig = await getDepositContractConfig(97, 11155111, 'MTT', BridgeType.TBRIDGE);
  await mockMystikoV2Bridge.mock.deposit.returns();
  await mockERC20.mock.balanceOf.returns('0');
  await mockERC20.mock.balanceOf.withArgs(etherWallet.address).returns(toDecimals(20).toString());
  await mockERC20.mock.allowance.returns('0');
  await mockERC20.mock.approve.reverts();
  await mockERC20.mock.approve
    .withArgs(depositContractConfig.address, toDecimals(10.11).toString())
    .returns(true);
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 11155111,
    assetSymbol: 'MTT',
    bridge: BridgeType.TBRIDGE,
    amount: 10,
    rollupFee: 0.1,
    bridgeFee: 0.01,
    executorFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
  expect(deposit.assetApproveTransactionHash).not.toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(4);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVING);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[2][2]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][1]).toBe(DepositStatus.SRC_PENDING);
  expect(mockCallback.mock.calls[3][2]).toBe(DepositStatus.SRC_SUCCEEDED);
});

test('test deposit with errors', async () => {
  await mockMystikoV2Loop.mock.deposit.reverts();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const depositContractConfig = await getDepositContractConfig(97, 97, 'BNB', BridgeType.LOOP);
  const mockCallback = jest.fn();
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'BNB',
    bridge: BridgeType.LOOP,
    amount: 0.1,
    rollupFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: mockCallback,
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  expect(deposit.status).toBe(DepositStatus.FAILED);
  expect(deposit.errorMessage).not.toBe(undefined);
  expect(mockCallback.mock.calls.length).toBe(2);
  expect(mockCallback.mock.calls[0][1]).toBe(DepositStatus.INIT);
  expect(mockCallback.mock.calls[0][2]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][1]).toBe(DepositStatus.ASSET_APPROVED);
  expect(mockCallback.mock.calls[1][2]).toBe(DepositStatus.FAILED);
});

test('test deposit statusCallback raise errors', async () => {
  await mockMystikoV2Loop.mock.deposit.returns();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const depositContractConfig = await getDepositContractConfig(97, 97, 'BNB', BridgeType.LOOP);
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'BNB',
    bridge: BridgeType.LOOP,
    amount: 0.1,
    rollupFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
    statusCallback: () => {
      throw new Error('callback error');
    },
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await checkDeposit(deposit, options, depositContractConfig);
});

test('test fixStatus', async () => {
  await mockMystikoV2Loop.mock.deposit.returns();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  const depositContractConfig = await getDepositContractConfig(97, 97, 'BNB', BridgeType.LOOP);
  const options: DepositOptions = {
    srcChainId: 97,
    dstChainId: 97,
    assetSymbol: 'BNB',
    bridge: BridgeType.LOOP,
    amount: 0.1,
    rollupFee: 0.01,
    shieldedAddress: mystikoAccount.shieldedAddress,
    signer: mystikoSigner,
  };
  const { depositPromise } = await executor.execute(options, depositContractConfig);
  const deposit = await depositPromise;
  await deposit.atomicUpdate((data) => {
    deposit.status = DepositStatus.FAILED;
    return data;
  });
  const commitment = await commitmentHandler.findOne({
    chainId: deposit.dstChainId,
    contractAddress: deposit.dstPoolAddress,
    commitmentHash: deposit.commitmentHash,
  });
  if (commitment !== null) {
    await commitment.atomicUpdate((data) => {
      commitment.status = CommitmentStatus.FAILED;
      return data;
    });
  }
  await mockCommitmentPool.mock.isHistoricCommitments.returns(true);
  const updatedDeposit = await executor.fixStatus(deposit);
  const updatedCommitment = await commitmentHandler.findOne({
    chainId: deposit.dstChainId,
    contractAddress: deposit.dstPoolAddress,
    commitmentHash: deposit.commitmentHash,
  });
  expect(updatedDeposit.status).toBe(DepositStatus.QUEUED);
  expect(updatedDeposit.errorMessage).toBe(undefined);
  expect(updatedCommitment?.status).toBe(CommitmentStatus.QUEUED);
});
