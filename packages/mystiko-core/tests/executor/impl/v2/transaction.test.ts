import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { MockProvider } from '@ethereum-waffle/provider';
import { BridgeType, MystikoConfig, PoolContractConfig } from '@mystikonetwork/config';
import {
  CommitmentPool__factory,
  ERC20__factory,
  MystikoContractFactory,
  SupportedContractType,
} from '@mystikonetwork/contracts-abi';
import { Account, TransactionEnum } from '@mystikonetwork/database';
import { PrivateKeySigner } from '@mystikonetwork/ethers';
import { readJsonFile, toDecimals } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
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
let walletHandler: WalletHandlerV2;
let accountHandler: AccountHandlerV2;
let commitmentHandler: CommitmentHandlerV2;
let transactionHandler: TransactionHandlerV2;
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
  };
  const contractConfig = getPoolContractConfig(
    transferOptions.chainId,
    transferOptions.assetSymbol,
    transferOptions.bridgeType,
  );
  return { transferOptions, withdrawOptions, contractConfig };
}

beforeEach(async () => {
  etherWallet = ethers.Wallet.createRandom();
  mockProvider = new MockProvider({
    ganacheOptions: {
      accounts: [{ balance: toDecimals(1), secretKey: etherWallet.privateKey }],
    },
  });
  const [signer] = mockProvider.getWallets();
  mockERC20 = await deployMockContract(signer, ERC20__factory.abi);
  mockCommitmentPool = await deployMockContract(signer, CommitmentPool__factory.abi);
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
  walletHandler = new WalletHandlerV2(context);
  accountHandler = new AccountHandlerV2(context);
  commitmentHandler = new CommitmentHandlerV2(context);
  transactionHandler = new TransactionHandlerV2(context);
  executor = new TransactionExecutorV2(context);
  mystikoSigner = new PrivateKeySigner(config, context.providers);
  await context.db.importJSON(await readJsonFile('tests/files/database.sync.test.json'));
  await walletHandler.checkCurrent();
  await walletHandler.checkPassword(walletPassword);
  mystikoAccount = await accountHandler.create(walletPassword);
});

afterEach(async () => {
  await context.db.remove();
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
  const { withdrawOptions, contractConfig } = getTestOptions();
  await mockERC20.mock.balanceOf.reverts();
  await mockERC20.mock.balanceOf.withArgs(contractConfig.address).returns('0');
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
