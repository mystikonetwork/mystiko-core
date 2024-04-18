// eslint-disable-next-line max-classes-per-file
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
import { ECIES } from '@mystikonetwork/ecies';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import {
  GetJobStatusRequest,
  GetRegisterRequest,
  IRelayerHandler as GasRelayers,
  RelayTransactRequest,
  WaitingJobRequest,
} from '@mystikonetwork/gas-relayer-client';
import { RegisterInfo, TransactResponse, TransactStatus } from '@mystikonetwork/gas-relayer-config';
import { Point, SecretSharing } from '@mystikonetwork/secret-share';
import { fromDecimals, readJsonFile, toBN, toDecimals } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  ContractHandlerV2,
  createError,
  createErrorPromise,
  GasRelayerInfo,
  MystikoContextInterface,
  MystikoErrorCode,
  TransactionExecutorV2,
  TransactionHandlerV2,
  TransactionOptions,
  TransactionQuoteOptions,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

class TestGasRelayerClient implements GasRelayers {
  public jobStatusRet?: TransactStatus;

  public registerInfoRet?: RegisterInfo[];

  public relayTransactRet?: TransactResponse;

  public waitUntilConfirmedRet?: TransactStatus;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public jobStatus(request: GetJobStatusRequest): Promise<TransactStatus> {
    if (this.jobStatusRet) {
      return Promise.resolve(this.jobStatusRet);
    }
    return createErrorPromise('jobStatusRet is not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public registerInfo(request: GetRegisterRequest): Promise<RegisterInfo[]> {
    if (this.registerInfoRet) {
      return Promise.resolve(this.registerInfoRet);
    }
    return createErrorPromise('registerInfoRet is not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public relayTransact(request: RelayTransactRequest): Promise<TransactResponse> {
    if (this.relayTransactRet) {
      return Promise.resolve(this.relayTransactRet);
    }
    return createErrorPromise('relayTransactRet is not set');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public waitUntilConfirmed(request: WaitingJobRequest): Promise<TransactStatus> {
    if (this.waitUntilConfirmedRet) {
      return Promise.resolve(this.waitUntilConfirmedRet);
    }
    return createErrorPromise('waitUntilConfirmedRet is not set');
  }
}

class WrappedMockProvider extends MockProvider {
  public txReceipt: ethers.providers.TransactionReceipt;

  public emptyTxReceipt?: boolean;

  constructor(secretKey: string, emptyTxReceipt?: boolean) {
    super({
      ganacheOptions: {
        accounts: [{ balance: toDecimals(1), secretKey }],
      },
    });
    this.txReceipt = { transactionHash: '' } as ethers.providers.TransactionReceipt;
    this.emptyTxReceipt = emptyTxReceipt;
  }

  public waitForTransaction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transactionHash: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    confirmations?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    timeout?: number,
  ): Promise<ethers.providers.TransactionReceipt> {
    return Promise.resolve(this.txReceipt);
  }

  public getTransactionReceipt(transactionHash: string): Promise<ethers.providers.TransactionReceipt> {
    if (this.emptyTxReceipt) {
      return Promise.resolve(this.txReceipt);
    }
    return super.getTransactionReceipt(transactionHash);
  }
}

let config: MystikoConfig;
let context: MystikoContextInterface;
let executor: TransactionExecutorV2;
let mockERC20: MockContract;
let mockCommitmentPool: MockContract;
let mockProvider: WrappedMockProvider;
let etherWallet: ethers.Wallet;
let mystikoAccount: Account;
let mystikoSigner: PrivateKeySigner;
const walletPassword = 'P@ssw0rd';
const auditorSecretKeys: BN[] = [];
const auditorPublicKeys: BN[] = [];
const gasRelayers: TestGasRelayerClient = new TestGasRelayerClient();

async function getPoolContractConfig(
  chainId: number,
  assetSymbol: string,
  bridgeType: BridgeType,
): Promise<PoolContractConfig> {
  const poolContractConfig = config.getPoolContractConfig(chainId, assetSymbol, bridgeType, 2);
  if (!poolContractConfig) {
    throw new Error('poolContractConfig should not be undefined');
  }
  await mockCommitmentPool.mock.getMinRollupFee.returns(poolContractConfig.minRollupFee.toString());
  return poolContractConfig;
}

type TestOptions = {
  transferOptions: TransactionOptions;
  withdrawOptions: TransactionOptions;
  contractConfig: PoolContractConfig;
};

async function getTestOptions(): Promise<TestOptions> {
  const transferOptions: TransactionOptions = {
    walletPassword,
    type: TransactionEnum.TRANSFER,
    chainId: 11155111,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    version: 2,
    shieldedAddress: mystikoAccount.shieldedAddress,
    amount: 6,
    rollupFee: 0.1,
    signer: mystikoSigner,
    statusCallback: jest.fn(),
  };
  const withdrawOptions: TransactionOptions = {
    walletPassword,
    type: TransactionEnum.WITHDRAW,
    chainId: 11155111,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    version: 2,
    publicAddress: etherWallet.address,
    publicAmount: 5,
    rollupFee: 0.1,
    signer: mystikoSigner,
    statusCallback: jest.fn(),
  };
  const contractConfig = await getPoolContractConfig(
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
  const testOptions = await getTestOptions();
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
  await mockCommitmentPool.mock.getAllAuditorPublicKeys.returns(auditorPublicKeys.map((pk) => pk.toString()));
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
  const expectFullAmount = toDecimals(
    options.amount || options.publicAmount || 0,
    contractConfig.assetDecimals,
  );
  let expectGasRelayerFeeAmount: number = 0;
  const { gasRelayerInfo } = options;
  if (gasRelayerInfo) {
    expectGasRelayerFeeAmount = fromDecimals(
      TransactionExecutorV2.calcGasRelayerFee(expectFullAmount, gasRelayerInfo),
      contractConfig.assetDecimals,
    );
  }
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
  const { numOfAuditors, auditingThreshold } = executor.protocol;
  const encryptedAuditorNotes = tx.encryptedAuditorNotes || [];
  expect(encryptedAuditorNotes.length).toBe(numInput * numOfAuditors);
  for (let i = 0; i < numInput; i += 1) {
    const decryptedShares: Point[] = [];
    for (let j = 0; j < numOfAuditors; j += 1) {
      const auditorSk = auditorSecretKeys[j];
      const randomAuditingPublicKey = toBN(tx.randomAuditingPublicKey || '0');
      decryptedShares.push({
        x: toBN(j + 1),
        y: ECIES.decrypt(
          toBN(encryptedAuditorNotes[i * numOfAuditors + j]),
          auditorSk,
          randomAuditingPublicKey,
        ),
      });
    }
    const commitment = SecretSharing.recover(decryptedShares.slice(0, auditingThreshold));
    expect(commitment.toString()).toBe(inputCommitments[i].commitmentHash);
  }
}

beforeAll(async () => {
  etherWallet = ethers.Wallet.createRandom();
  mockProvider = new WrappedMockProvider(etherWallet.privateKey);
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
  context.chains = new ChainHandlerV2(context);
  context.contracts = new ContractHandlerV2(context);
  context.gasRelayers = gasRelayers;
  executor = new TransactionExecutorV2(context);
  for (let i = 0; i < executor.protocol.numOfAuditors; i += 1) {
    const sk = ECIES.generateSecretKey();
    auditorSecretKeys.push(sk);
    auditorPublicKeys.push(ECIES.publicKey(sk));
  }
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
    version: 2,
  };
  let contractConfig = await getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  let quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  options.amount = -0.1;
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).not.toBe(undefined);
  options.amount = 0.1;
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  options.chainId = 11155111;
  options.type = TransactionEnum.WITHDRAW;
  options.assetSymbol = 'MTT';
  options.bridgeType = BridgeType.TBRIDGE;
  options.amount = undefined;
  options.publicAmount = 5;
  contractConfig = await getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  await mockCommitmentPool.mock.getMinRollupFee.returns(contractConfig.minRollupFee.muln(2).toString());
  quote = await executor.quote(options, contractConfig);
  expect(quote.minRollupFee).toBe(contractConfig.minRollupFeeNumber * 2);
  await mockCommitmentPool.mock.getMinRollupFee.reverts();
  quote = await executor.quote(options, contractConfig);
  expect(quote.minRollupFee).toBe(contractConfig.minRollupFeeNumber);
});

test('test quote with gas relayers', async () => {
  const options: TransactionQuoteOptions = {
    type: TransactionEnum.WITHDRAW,
    chainId: 11155111,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    publicAmount: 1,
    useGasRelayers: true,
  };
  const contractConfig = await getPoolContractConfig(
    options.chainId,
    options.assetSymbol,
    options.bridgeType,
  );
  let quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([]);
  const registerInfo: RegisterInfo = {
    chainId: 11155111,
    available: true,
    support: true,
    registerUrl: 'http://127.0.0.1:8090/',
    registerName: 'sepolia',
    relayerAddress: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
    contracts: [
      {
        assetSymbol: 'MTT',
        relayerFeeOfTenThousandth: 25,
        minimumGasFee: '100000000000000000',
      },
    ],
  };
  const expectedGasRelayerInfo: GasRelayerInfo = {
    url: 'http://127.0.0.1:8090/',
    name: 'sepolia',
    address: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
    serviceFeeOfTenThousandth: 25,
    serviceFeeRatio: 0.0025,
    minGasFee: '100000000000000000',
    minGasFeeNumber: 0.1,
  };
  gasRelayers.registerInfoRet = [registerInfo];
  quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([expectedGasRelayerInfo]);
  registerInfo.support = false;
  quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([]);
  registerInfo.support = true;
  registerInfo.available = false;
  quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([]);
  const { contracts } = registerInfo;
  if (contracts) {
    registerInfo.support = true;
    registerInfo.available = true;
    contracts[0].assetSymbol = 'BNB';
    quote = await executor.quote(options, contractConfig);
    expect(quote.gasRelayers).toStrictEqual([]);
    registerInfo.support = true;
    registerInfo.available = true;
    contracts[0].assetSymbol = 'MTT';
    contracts[0].minimumGasFee = '1000000000000000000';
    quote = await executor.quote(options, contractConfig);
    expect(quote.gasRelayers).toStrictEqual([]);
    registerInfo.support = true;
    registerInfo.available = true;
    contracts[0].assetSymbol = 'MTT';
    contracts[0].minimumGasFee = '100000000000000000';
    options.publicAmount = undefined;
    quote = await executor.quote(options, contractConfig);
    expect(quote.gasRelayers).toStrictEqual([]);
  }
  options.type = TransactionEnum.TRANSFER;
  options.amount = 1;
  quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([expectedGasRelayerInfo]);
  gasRelayers.registerInfoRet = undefined;
  quote = await executor.quote(options, contractConfig);
  expect(quote.gasRelayers).toStrictEqual([]);
});

test('test invalid options', async () => {
  const { transferOptions, withdrawOptions, contractConfig } = await getTestOptions();
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
  await expect(
    executor.summary(
      {
        ...transferOptions,
        gasRelayerInfo: {
          url: 'http://localhost:9999',
          name: 'test gas relayer',
          address: etherWallet.address,
          serviceFeeOfTenThousandth: 25,
          serviceFeeRatio: 0.0025,
          minGasFeeNumber: -20,
          minGasFee: '-20000000000000000000',
        },
      },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError('gas relayer fee cannot be negative', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await expect(executor.summary({ ...transferOptions, chainId: 1024 }, contractConfig)).rejects.toThrow(
    createError('cannot get provider for chainId=1024', MystikoErrorCode.NON_EXISTING_CHAIN),
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
  await expect(
    executor.summary(
      {
        ...transferOptions,
        gasRelayerInfo: {
          url: 'http://localhost:9999',
          name: 'test gas relayer',
          address: etherWallet.address,
          serviceFeeOfTenThousandth: 25,
          serviceFeeRatio: 0.0025,
          minGasFeeNumber: 20,
          minGasFee: '20000000000000000000',
        },
      },
      contractConfig,
    ),
  ).rejects.toThrow(
    createError('rollup fee or gas relayer fee is too high', MystikoErrorCode.INVALID_TRANSACTION_OPTIONS),
  );
  await mockCommitmentPool.mock.getMinRollupFee.returns(contractConfig.minRollupFee.muln(2).toString());
  await expect(
    executor.summary({ ...transferOptions, amount: 4, rollupFee: 0.01 }, contractConfig),
  ).rejects.toThrow(
    createError(
      'rollup fee is too small to pay rollup service',
      MystikoErrorCode.INVALID_TRANSACTION_OPTIONS,
    ),
  );
  await expect(
    executor.summary(
      {
        ...transferOptions,
        gasRelayerInfo: {
          url: 'http://localhost:9999',
          name: 'test gas relayer',
          address: 'not an address',
          serviceFeeOfTenThousandth: 25,
          serviceFeeRatio: 0.0025,
          minGasFeeNumber: 0.01,
          minGasFee: '10000000000000000',
        },
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
        gasRelayerInfo: {
          url: 'not an endpoint url',
          name: 'test gas relayer',
          address: etherWallet.address,
          serviceFeeOfTenThousandth: 25,
          serviceFeeRatio: 0.0025,
          minGasFeeNumber: 0.01,
          minGasFee: '10000000000000000',
        },
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
  const gasRelayerInfo: GasRelayerInfo = {
    url: 'http://127.0.0.1:8090/',
    name: 'test gas relayer',
    address: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
    serviceFeeOfTenThousandth: 25,
    serviceFeeRatio: 0.0025,
    minGasFee: '10000000000000000',
    minGasFeeNumber: 0.01,
  };
  const { transferOptions, withdrawOptions, contractConfig } = await getTestOptions();
  transferOptions.gasRelayerInfo = gasRelayerInfo;
  withdrawOptions.gasRelayerInfo = gasRelayerInfo;
  let transferSummary = await executor.summary(transferOptions, contractConfig);
  expect(transferSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 3.9,
    assetSymbol: 'MTT',
    recipient: mystikoAccount.shieldedAddress,
    withdrawingAmount: 0,
    transferringAmount: 5.775,
    rollupFeeAmount: 0.2,
    rollupFeeAssetSymbol: 'MTT',
    gasRelayerFeeAmount: 0.025,
    gasRelayerFeeAssetSymbol: 'MTT',
    gasRelayerAddress: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
  });
  transferOptions.gasRelayerInfo = undefined;
  transferSummary = await executor.summary(transferOptions, contractConfig);
  expect(transferSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 3.9,
    assetSymbol: 'MTT',
    recipient: mystikoAccount.shieldedAddress,
    withdrawingAmount: 0,
    transferringAmount: 5.8,
    rollupFeeAmount: 0.2,
    rollupFeeAssetSymbol: 'MTT',
    gasRelayerFeeAmount: 0,
    gasRelayerFeeAssetSymbol: 'MTT',
    gasRelayerAddress: undefined,
  });
  let withdrawSummary = await executor.summary(withdrawOptions, contractConfig);
  expect(withdrawSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 4.9,
    assetSymbol: 'MTT',
    recipient: etherWallet.address,
    withdrawingAmount: 4.9775,
    transferringAmount: 0,
    rollupFeeAmount: 0,
    rollupFeeAssetSymbol: 'MTT',
    gasRelayerFeeAmount: 0.0225,
    gasRelayerFeeAssetSymbol: 'MTT',
    gasRelayerAddress: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
  });
  withdrawOptions.gasRelayerInfo = undefined;
  withdrawSummary = await executor.summary(withdrawOptions, contractConfig);
  expect(withdrawSummary).toStrictEqual({
    previousBalance: 9.9,
    newBalance: 4.9,
    assetSymbol: 'MTT',
    recipient: etherWallet.address,
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
  const { transferOptions, contractConfig } = await getTestOptions();
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
    'unknown merkle.ts tree root, your wallet data might be out of sync or be corrupted',
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
  await context.db.collections.accounts.clear();
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

test('test transaction with gas relayers', async () => {
  const { withdrawOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  withdrawOptions.gasRelayerInfo = {
    url: 'http://127.0.0.1:8090/',
    name: 'test gas relayer',
    address: '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
    serviceFeeOfTenThousandth: 25,
    serviceFeeRatio: 0.0025,
    minGasFee: '10000000000000000',
    minGasFeeNumber: 0.01,
  };
  const relayTransactRet = {
    id: '1',
    hash: '0xf1a37404bc619328699869ab412cc848b51b98af2ca7055214f55b998f4d420c',
    chainId: withdrawOptions.chainId,
    nonce: 1,
  };
  gasRelayers.relayTransactRet = relayTransactRet;
  mockProvider.txReceipt = {
    transactionHash: '0xf1a37404bc619328699869ab412cc848b51b98af2ca7055214f55b998f4d420c',
  } as ethers.providers.TransactionReceipt;
  let exeRet = await executor.execute(withdrawOptions, contractConfig);
  await exeRet.transactionPromise;
  await checkTransaction(1, 0, exeRet.transaction, withdrawOptions, contractConfig);

  withdrawOptions.publicAmount = 1;
  gasRelayers.relayTransactRet = undefined;
  exeRet = await executor.execute(withdrawOptions, contractConfig);
  await exeRet.transactionPromise;
  expect(exeRet.transaction.status).toBe(TransactionStatus.FAILED);
  expect(exeRet.transaction.errorMessage).toBe('relayTransactRet is not set');

  gasRelayers.relayTransactRet = relayTransactRet;
  mockProvider.txReceipt = {
    transactionHash: '0xf1a37404bc619328699869ab412cc848b51b98af2ca7055214f55b998f4d420c',
    status: 0,
  } as ethers.providers.TransactionReceipt;
  exeRet = await executor.execute(withdrawOptions, contractConfig);
  await exeRet.transactionPromise;
  expect(exeRet.transaction.status).toBe(TransactionStatus.FAILED);
  expect(exeRet.transaction.errorMessage).toBe('transaction failed');
});

test('test fixStatus', async () => {
  const { transferOptions, contractConfig } = await setupMocks({
    isKnownRoot: true,
    transactSuccess: true,
  });
  transferOptions.amount = 8;
  const { transaction, transactionPromise } = await executor.execute(transferOptions, contractConfig);
  await transactionPromise;
  mockProvider.emptyTxReceipt = true;
  mockProvider.txReceipt = {
    transactionHash: '0xf1a37404bc619328699869ab412cc848b51b98af2ca7055214f55b998f4d420c',
  } as ethers.providers.TransactionReceipt;
  await mockCommitmentPool.mock.isHistoricCommitment.returns(false);
  await mockCommitmentPool.mock.isSpentSerialNumber.returns(false);
  const updatedTransaction = await executor.fixStatus(transaction);
  expect(updatedTransaction.status).toBe(TransactionStatus.FAILED);
  const inputCommitments: Commitment[] = await transaction.populate('inputCommitments');
  const outputCommitments: Commitment[] = await transaction.populate('outputCommitments');
  inputCommitments.forEach((commitment) => expect(commitment.status).toBe(CommitmentStatus.INCLUDED));
  expect(outputCommitments.length).toBe(0);
});
