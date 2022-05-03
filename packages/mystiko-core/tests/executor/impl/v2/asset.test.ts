import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { MockProvider } from '@ethereum-waffle/provider';
import { ERC20__factory, MystikoContractFactory, SupportedContractType } from '@mystikonetwork/contracts-abi';
import { fromDecimals, ProviderConnection, ProviderFactory, toDecimals } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AssetExecutorApproveOptions,
  AssetExecutorV2,
  createError,
  MystikoContextInterface,
  MystikoContractConnector,
  MystikoErrorCode,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let etherWallet: ethers.Wallet;
let provider: MockProvider;
let mockERC20: MockContract;
let context: MystikoContextInterface;
let executor: AssetExecutorV2;

beforeAll(async () => {
  etherWallet = ethers.Wallet.createRandom();
  provider = new MockProvider({
    ganacheOptions: {
      accounts: [
        { balance: toDecimals(100), secretKey: etherWallet.privateKey },
        { balance: toDecimals(100), secretKey: ethers.Wallet.createRandom().privateKey },
      ],
    },
  });
  const [signer] = provider.getWallets();
  const contractConnector: MystikoContractConnector = {
    connect<T extends SupportedContractType>(contractName: string, address: string): T {
      expect(address).toBe(mockERC20.address);
      return MystikoContractFactory.connect<T>(contractName, address, signer);
    },
  };
  const providerFactory: ProviderFactory = {
    createProvider(): ethers.providers.Provider {
      return provider;
    },
  };
  const providerConfigGetter = (chainId: number) => {
    if (chainId === 3) {
      return Promise.resolve([{ url: 'http://localhost:8545' } as ProviderConnection]);
    }
    return Promise.resolve([]);
  };
  context = await createTestContext({ contractConnector, providerConfigGetter, providerFactory });
  executor = new AssetExecutorV2(context);
});

beforeEach(async () => {
  const [, signer] = provider.getWallets();
  mockERC20 = await deployMockContract(signer, ERC20__factory.abi);
});

afterAll(async () => {
  await context.db.remove();
});

test('test erc20 balance', async () => {
  const addressToCheck = '0x8b8B829034ba2A53690c178b14E0D59d54004D07';
  await mockERC20.mock.balanceOf.returns('0');
  await mockERC20.mock.balanceOf.withArgs(addressToCheck).returns(toDecimals(1024, 16).toString());
  const options = {
    chainId: 3,
    assetAddress: mockERC20.address,
    address: addressToCheck,
  };
  let balance = await executor.balance(options);
  expect(fromDecimals(balance, 16)).toBe(1024);
  options.address = '0x64BaB5ed694635F0b5d594D78A0Dd0a8499f174e';
  balance = await executor.balance(options);
  expect(fromDecimals(balance, 16)).toBe(0);
  options.chainId = 97;
  await expect(executor.balance(options)).rejects.toThrow(
    createError(
      `no provider configured for chain id=${options.chainId}`,
      MystikoErrorCode.NON_EXISTING_PROVIDER,
    ),
  );
});

test('test main asset balance', async () => {
  const options = {
    chainId: 3,
    address: etherWallet.address,
  };
  let balance = await executor.balance(options);
  expect(fromDecimals(balance)).toBe(100);
  options.address = '0x64BaB5ed694635F0b5d594D78A0Dd0a8499f174e';
  balance = await executor.balance(options);
  expect(fromDecimals(balance)).toBe(0);
});

test('test approve', async () => {
  const addressToCheck = '0x8b8B829034ba2A53690c178b14E0D59d54004D07';
  await mockERC20.mock.allowance.returns(toDecimals(0).toString());
  await mockERC20.mock.approve.reverts();
  await mockERC20.mock.approve.withArgs(addressToCheck, toDecimals(150).toString()).returns(true);
  const options: AssetExecutorApproveOptions = {
    chainId: 3,
    assetAddress: mockERC20.address,
    assetSymbol: 'MTT',
    assetDecimals: 18,
    amount: toDecimals(150).toString(),
    spender: addressToCheck,
    signer: etherWallet,
  };
  const txResp = await executor.approve(options);
  expect(txResp).not.toBe(undefined);
  options.assetAddress = undefined;
  await expect(executor.approve(options)).rejects.toThrow(
    createError(
      `invalid asset approve options ${options}, missing asset contract address`,
      MystikoErrorCode.INVALID_ASSET_APPROVE_OPTIONS,
    ),
  );
});

test('test no need approve', async () => {
  const addressToCheck = '0x8b8B829034ba2A53690c178b14E0D59d54004D07';
  await mockERC20.mock.allowance.returns(toDecimals(0).toString());
  await mockERC20.mock.allowance
    .withArgs(etherWallet.address, addressToCheck)
    .returns(toDecimals(200).toString());
  await mockERC20.mock.approve.reverts();
  const options = {
    chainId: 3,
    assetAddress: mockERC20.address,
    assetSymbol: 'MTT',
    assetDecimals: 18,
    amount: toDecimals(150).toString(),
    address: etherWallet.address,
    spender: addressToCheck,
    signer: etherWallet,
  };
  const txResp = await executor.approve(options);
  expect(txResp).toBe(undefined);
});
