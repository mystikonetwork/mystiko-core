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
  MystikoContextInterface,
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
  options: TransactionOptions;
  contractConfig: PoolContractConfig;
};

function getTestOptions(): TestOptions {
  const options: TransactionOptions = {
    walletPassword,
    type: TransactionEnum.TRANSFER,
    chainId: 3,
    assetSymbol: 'MTT',
    bridgeType: BridgeType.TBRIDGE,
    shieldedAddress: mystikoAccount.shieldedAddress,
    amount: 20,
    rollupFee: 0.1,
    signer: mystikoSigner,
  };
  const contractConfig = getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  return { options, contractConfig };
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
  options.publicAmount = 20;
  contractConfig = getPoolContractConfig(options.chainId, options.assetSymbol, options.bridgeType);
  quote = await executor.quote(options, contractConfig);
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
});
