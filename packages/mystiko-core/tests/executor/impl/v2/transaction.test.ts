import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { MockProvider } from '@ethereum-waffle/provider';
import { BridgeType, MystikoConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  CommitmentPool__factory,
  ERC20__factory,
  MystikoContractFactory,
  SupportedContractType,
} from '@mystikonetwork/contracts-abi';
import {
  Account,
  Commitment,
  CommitmentStatus,
  initDatabase,
  Transaction,
  TransactionEnum,
  TransactionStatus,
} from '@mystikonetwork/database';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import { readJsonFile, toBN, toDecimals } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  CommitmentHandlerV2,
  createError,
  MystikoContextInterface,
  MystikoErrorCode,
  TransactionExecutorV2,
  TransactionHandlerV2,
  TransactionOptions,
  TransactionQuoteOptions,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let config: MystikoConfig;
let context: MystikoContextInterface;
let executor: TransactionExecutorV2;
let mockERC20: MockContract;
let mockCommitmentPool: MockContract;
let mockProvider: MockProvider;
let etherWallet: ethers.Wallet;
let mystikoAccount: Account;
let mystikoSigner: PrivateKeySigner;
const walletPassword = 'P@ssw0rd';

function getPoolContractConfig(
  chainId: number,
  assetSymbol: string,
  bridgeType: BridgeType,
): PoolContractConfig {
  const poolContractConfig = config.getPoolContractConfig(chainId, assetSymbol, bridgeType);
  if (!poolContractConfig) {
    throw new Error('poolContractConfig should not be undefined');
  }
  return poolContractConfig;
}

type TestOptions = {
  transferOptions: TransactionOptions;
  withdrawOptions: TransactionOptions;
  contractConfig: PoolContractConfig;
};

function getTestOptions(): TestOptions {
  const transferOptions: TransactionOptions = {
    walletPassword,
    type: TransactionEnum.TRANSFER,
    chainId: 3,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    shieldedAddress: mystikoAccount.shieldedAddress,
    amount: 6,
    rollupFee: 0.1,
    signer: mystikoSigner,
    statusCallback: jest.fn(),
  };
  const withdrawOptions: TransactionOptions = {
    walletPassword,
    type: TransactionEnum.WITHDRAW,
    chainId: 3,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    publicAddress: etherWallet.address,
    publicAmount: 5,
    rollupFee: 0.1,
    signer: mystikoSigner,
    statusCallback: jest.fn(),
  };
  const contractConfig = getPoolContractConfig(
    transferOptions.chainId,
    transferOptions.assetSymbol,
    transferOptions.bridgeType,
  );
  return { transferOptions, withdrawOptions, contractConfig };
}

type MockSetupOptions = {
  poolBalance?: string;
  isKnownRoot?: boolean;
  isSpentSerialNumber?: boolean;
  transactSuccess?: boolean;
};

async function setupMocks(options: MockSetupOptions): Promise<TestOptions> {
  const testOptions = getTestOptions();
  mystikoSigner.setPrivateKey(etherWallet.privateKey);
  await mockERC20.mock.balanceOf.reverts();
  await mockERC20.mock.balanceOf
    .withArgs(testOptions.contractConfig.address)
    .returns(options.poolBalance || toDecimals(50).toString());
  await mockCommitmentPool.mock.isKnownRoot.returns(!!options.isKnownRoot);
  await mockCommitmentPool.mock.isSpentSerialNumber.returns(!!options.isSpentSerialNumber);
  if (options.transactSuccess) {
    await mockCommitmentPool.mock.transact.returns();
  } else {
    await mockCommitmentPool.mock.transact.reverts();
  }
  return Promise.resolve(testOptions);
}

async function checkTransaction(
  numInput: number,
  numOutput: number,
  tx: Transaction,
  options: TransactionOptions,
  contractConfig: PoolContractConfig,
  hasError?: boolean,
) {
  expect(tx.status).toBe(hasError ? TransactionStatus.FAILED : TransactionStatus.SUCCEEDED);
  if (hasError) {
    expect(tx.errorMessage).not.toBe(undefined);
  } else {
    expect(tx.errorMessage).toBe(undefined);
  }
  expect(tx.chainId).toBe(options.chainId);
  expect(tx.contractAddress).toBe(contractConfig.address);
  expect(tx.assetSymbol).toBe(contractConfig.assetSymbol);
  expect(tx.assetDecimals).toBe(contractConfig.assetDecimals);
  expect(tx.assetAddress).toBe(contractConfig.assetAddress);
  expect(tx.proof).not.toBe(undefined);
  expect(tx.rootHash).not.toBe(undefined);
  expect(tx.signaturePublicKey).not.toBe(undefined);
  expect(tx.signature).not.toBe(undefined);
  expect(tx.inputCommitments?.length).toBe(numInput);
  expect(tx.serialNumbers?.length).toBe(numInput);
  expect(tx.signaturePublicKeyHashes?.length).toBe(numInput);
  expect(tx.outputCommitments?.length).toBe(numOutput);
  const expectRollupFeeAmount = (options.rollupFee || 0) * numOutput;
  const expectGasRelayerFeeAmount = options.gasRelayerFee || 0;
  const expectAmount = options.amount
    ? options.amount - expectRollupFeeAmount - expectGasRelayerFeeAmount
    : 0;
  const expectPublicAmount = options.publicAmount
    ? options.publicAmount - expectRollupFeeAmount - expectGasRelayerFeeAmount
    : 0;
  expect(tx.simpleAmount()).toBe(expectAmount);
  expect(tx.simplePublicAmount()).toBe(expectPublicAmount);
  expect(tx.simpleRollupFeeAmount()).toBe(expectRollupFeeAmount);
  expect(tx.simpleGasRelayerFeeAmount()).toBe(expectGasRelayerFeeAmount);
  expect(tx.shieldedAddress).toBe(options.shieldedAddress);
  expect(tx.publicAddress).toBe(options.publicAddress);
  expect(tx.type).toBe(options.type);
  if (!hasError) {
    expect(tx.transactionHash).not.toBe(undefined);
  }
  expect(tx.wallet).toBe((await context.wallets.current())?.id);
  const inputCommitments: Commitment[] = await tx.populate('inputCommitments');
  let totalInputAmount = toBN(0);
  inputCommitments.forEach((commitment, index) => {
    expect(commitment.status).toBe(hasError ? CommitmentStatus.INCLUDED : CommitmentStatus.SPENT);
    const serialNumber = tx.serialNumbers ? tx.serialNumbers[index] : undefined;
    expect(serialNumber).toBe(commitment.serialNumber);
    if (!hasError) {
      expect(commitment.spendingTransactionHash).toBe(tx.transactionHash);
    }
    totalInputAmount = totalInputAmount.add(toBN(commitment.amount || 0));
  });
  const outputCommitments: Commitment[] = await tx.populate('outputCommitments');
  let totalOutputAmount = toBN(0);
  outputCommitments.forEach((commitment) => {
    expect(commitment.status).toBe(hasError ? CommitmentStatus.FAILED : CommitmentStatus.QUEUED);
    if (!hasError) {
      expect(commitment.creationTransactionHash).toBe(tx.transactionHash);
    }
    totalOutputAmount = totalOutputAmount.add(toBN(commitment.amount || 0));
  });
  expect(totalInputAmount.toString()).toBe(
    totalOutputAmount
      .add(toBN(tx.publicAmount))
      .add(toBN(tx.rollupFeeAmount))
      .add(toBN(tx.gasRelayerFeeAmount))
      .toString(),
  );
  const statusCallback = options.statusCallback as jest.Mock;
  expect(statusCallback.mock.calls.length).toBe(hasError ? 3 : 4);
  expect(statusCallback.mock.calls[0][1]).toBe(TransactionStatus.INIT);
  expect(statusCallback.mock.calls[0][2]).toBe(TransactionStatus.PROOF_GENERATING);
  expect(statusCallback.mock.calls[1][1]).toBe(TransactionStatus.PROOF_GENERATING);
  expect(statusCallback.mock.calls[1][2]).toBe(TransactionStatus.PROOF_GENERATED);
  if (hasError) {
    expect(statusCallback.mock.calls[2][1]).toBe(TransactionStatus.PROOF_GENERATED);
    expect(statusCallback.mock.calls[2][2]).toBe(TransactionStatus.FAILED);
  } else {
    expect(statusCallback.mock.calls[2][1]).toBe(TransactionStatus.PROOF_GENERATED);
    expect(statusCallback.mock.calls[2][2]).toBe(TransactionStatus.PENDING);
    expect(statusCallback.mock.calls[3][1]).toBe(TransactionStatus.PENDING);
    expect(statusCallback.mock.calls[3][2]).toBe(TransactionStatus.SUCCEEDED);
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
        return MystikoContractFactory.connect<T>(contractName, mockCommitmentPool.address, signer);
      },
    },
  });
  context.wallets = new WalletHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
  context.assets = new AssetHandlerV2(context);
  context.commitments = new CommitmentHandlerV2(context);
  context.transactions = new TransactionHandlerV2(context);
  executor = new TransactionExecutorV2(context);
});

afterAll(async () => {
  await context.db.remove();
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  await context.db.importJSON(await readJsonFile('tests/files/database.sync.test.json'));
  mystikoAccount = await context.accounts.create(walletPassword);
  const [signer] = mockProvider.getWallets();
  mockERC20 = await deployMockContract(signer, ERC20__factory.abi);
  mockCommitmentPool = await deployMockContract(signer, CommitmentPool__factory.abi);
  mystikoSigner = new PrivateKeySigner(config, context.providers);
});

test('test quote', async () => {
  const options: TransactionQuoteOptions = {
    type: TransactionEnum.TRANSFER,
    chainId: 97,
    assetSymbol: 'BNB',
    bridgeType: BridgeType.LOOP,
  };
  let contractConfig = getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  let quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).not.toBe(undefined);
  options.amount = 0.1;
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  options.chainId = 3;
  options.type = TransactionEnum.WITHDRAW;
  options.assetSymbol = 'MTT';
  options.bridgeType = BridgeType.TBRIDGE;
  options.amount = undefined;
  options.publicAmount = 5;
  contractConfig = getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
});

test('test invalid options', async () => {
  const { transferOptions, withdrawOptions, contractConfig } = getTestOptions();
  await expect(executor.summary({ ...transferOptions, amount: undefined }, contractConfig)).rejects.toThrow(
    createError('amount cannot be negative or zero or empty', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, amount: -1 }, contractConfig)).rejects.toThrow(
    createError('amount cannot be negative or zero or empty', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...withdrawOptions, publicAmount: undefined }, contractConfig),
  ).rejects.toThrow(
    createError(
      'publicAmount cannot be negative or zero or empty',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...withdrawOptions, publicAmount: -1 }, contractConfig)).rejects.toThrow(
    createError(
      'publicAmount cannot be negative or zero or empty',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(executor.summary({ ...transferOptions, rollupFee: -1 }, contractConfig)).rejects.toThrow(
    createError('rollup fee cannot be negative', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, gasRelayerFee: -1 }, contractConfig)).rejects.toThrow(
    createError('gas relayer fee cannot be negative', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, chainId: 1024 }, contractConfig)).rejects.toThrow(
    createError('no chain id=1024 configured', MystikoErrorCode.NON_EXISTING_CHAIN),
  );
  await expect(executor.summary({ ...transferOptions, chainId: 97 }, contractConfig)).rejects.toThrow(
    createError('given options mismatch with config', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, assetSymbol: 'ETH' }, contractConfig)).rejects.toThrow(
    createError('given options mismatch with config', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...transferOptions, bridgeType: BridgeType.LOOP }, contractConfig),
  ).rejects.toThrow(
    createError('given options mismatch with config', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, amount: 20 }, contractConfig)).rejects.toThrow(
    createError('asset amount cannot exceed 9.9', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, rollupFee: 20 }, contractConfig)).rejects.toThrow(
    createError('rollup fee or gas relayer fee is too high', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, gasRelayerFee: 20 }, contractConfig)).rejects.toThrow(
    createError('rollup fee or gas relayer fee is too high', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...transferOptions, amount: 4, rollupFee: 0.005 }, contractConfig),
  ).rejects.toThrow(
    createError(
      'rollup fee is too small to pay rollup service',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(
    executor.summary(
      { ...transferOptions, gasRelayerFee: 0.1, gasRelayerAddress: etherWallet.address },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError(
      'must specify gas relayer address and endpoint when gas relayer fee is not 0',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(
    executor.summary(
      { ...transferOptions, gasRelayerFee: 0.1, gasRelayerEndpoint: 'http://localhost:9999' },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError(
      'must specify gas relayer address and endpoint when gas relayer fee is not 0',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(
    executor.summary(
      {
        ...transferOptions,
        gasRelayerFee: 0.1,
        gasRelayerAddress: 'not an address',
        gasRelayerEndpoint: 'http://localhost:9999',
      },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError('invalid ethereum address for gas relayer', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary(
      {
        ...transferOptions,
        gasRelayerFee: 0.1,
        gasRelayerAddress: etherWallet.address,
        gasRelayerEndpoint: 'not an endpoint url',
      },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError('invalid endpoint url for gas relayer', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...transferOptions, shieldedAddress: undefined }, contractConfig),
  ).rejects.toThrow(
    createError('invalid mystiko address for transferring', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...transferOptions, shieldedAddress: 'deadbeef' }, contractConfig),
  ).rejects.toThrow(
    createError('invalid mystiko address for transferring', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...withdrawOptions, publicAddress: undefined }, contractConfig),
  ).rejects.toThrow(
    createError('invalid ethereum address for withdrawing', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(
    executor.summary({ ...withdrawOptions, publicAddress: 'deadbeef' }, contractConfig),
  ).rejects.toThrow(
    createError('invalid ethereum address for withdrawing', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
});

test('test summary', async () => {
  const { transferOptions, withdrawOptions, contractConfig } = getTestOptions();
  const transferSummary = await executor.summary(transferOptions, contractConfig);
  expect(transferSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 3.9,
    withdrawingAmount: 0,
    transferringAmount: 5.8,
    rollupFeeAmount: 0.2,
    rollupFeeAssetSymbol: 'MTT',
    gasRelayerFeeAmount: 0,
    gasRelayerFeeAssetSymbol: 'MTT',
    gasRelayerAddress: undefined,
  });
  const withdrawSummary = await executor.summary(withdrawOptions, contractConfig);
  expect(withdrawSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 4.9,
    withdrawingAmount: 5,
    transferringAmount: 0,
    rollupFeeAmount: 0,
    rollupFeeAssetSymbol: 'MTT',
    gasRelayerFeeAmount: 0,
    gasRelayerFeeAssetSymbol: 'MTT',
    gasRelayerAddress: undefined,
  });
});

test('test insufficient pool balance', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({ poolBalance: '0' });
  await expect(executor.execute(withdrawOptions, contractConfig)).rejects.toThrow(
    createError(
      `insufficient pool balance of contract=${contractConfig.address}`,
      MystikoErrorCode.INSUFFICIENT_POOL_BALANCE,
    ),
  );
});

test('test invalid signer', async () => {
  const { transferOptions, contractConfig } = getTestOptions();
  await expect(executor.execute(transferOptions, contractConfig)).rejects.toThrow(
    new Error('signer has not been connected'),
  );
});

test('test invalid root hash', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: false,
    isSpentSerialNumber: false,
  });
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toBe(
    'unknown merkle tree root, your wallet data might be out of sync or be corrupted',
  );
});

test('test already spent serial number', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    isSpentSerialNumber: true,
  });
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toBe('some commitments hava already been spent');
  const balances = await context.assets.balances();
  expect(balances.get('MTT')?.unspentTotal).toBe(14.9);
});

test('test serial number not set', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    isSpentSerialNumber: false,
  });
  const promises = await context.commitments
    .find({
      selector: { serialNumber: { $exists: true } },
    })
    .then((commitments) =>
      commitments.map((commitment) => commitment.update({ $unset: { serialNumber: '' } })),
    );
  await Promise.all(promises);
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toEqual(
    expect.stringMatching(/^serial number of commitment id=.* is empty$/),
  );
});

test('test serial number mismatch', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    isSpentSerialNumber: false,
  });
  const promises = await context.commitments
    .find({
      selector: { serialNumber: { $exists: true } },
    })
    .then((commitments) =>
      commitments.map((commitment) => commitment.update({ $set: { serialNumber: '123' } })),
    );
  await Promise.all(promises);
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toEqual(
    expect.stringMatching(/^generated commitment id=.* serial number mismatch$/),
  );
});

test('test corrupted commitment data without leafIndex', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  const promises = await context.commitments
    .find({
      selector: { leafIndex: { $exists: true } },
    })
    .then((commitments) => commitments.map((commitment) => commitment.update({ $unset: { leafIndex: '' } })));
  await Promise.all(promises);
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toEqual(expect.stringMatching(/^missing required data of commitment=.*$/));
});

test('test corrupted commitment data wrong leafIndex', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  const promises = await context.commitments
    .find({
      selector: { leafIndex: { $exists: true } },
    })
    .then((commitments) =>
      commitments.map((commitment) => commitment.update({ $set: { leafIndex: '1000' } })),
    );
  await Promise.all(promises);
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.FAILED);
  expect(transaction.errorMessage).toEqual(
    expect.stringMatching(/^leafIndex is not correct of commitment=.*$/),
  );
});

test('test transaction failure', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
  });
  transferOptions.amount = 8;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(2, 2, transaction, transferOptions, contractConfig, true);
});

test('test status callback error', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  withdrawOptions.statusCallback = () => {
    throw new Error('callback error');
  };
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  expect(transaction.status).toBe(TransactionStatus.SUCCEEDED);
  expect(transaction.errorMessage).toBe(undefined);
});

test('test transaction 1x0', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(1, 0, transaction, withdrawOptions, contractConfig);
});

test('test transaction 1x1', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  transferOptions.amount = 5;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(1, 1, transaction, transferOptions, contractConfig);
});

test('test transaction 1x2', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  transferOptions.amount = 3;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(1, 2, transaction, transferOptions, contractConfig);
});

test('test transaction 2x0', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  withdrawOptions.publicAmount = 9.9;
  const { transaction, transactionPromise } = await executor.execute(withdrawOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(2, 0, transaction, withdrawOptions, contractConfig);
});

test('test transaction 2x1', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  transferOptions.amount = 9.9;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(2, 1, transaction, transferOptions, contractConfig);
});

test('test transaction 2x2', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  transferOptions.amount = 8;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  await checkTransaction(2, 2, transaction, transferOptions, contractConfig);
});
