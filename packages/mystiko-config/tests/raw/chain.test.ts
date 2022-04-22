import {
  AssetType,
  BridgeType,
  ContractType,
  RawAssetConfig,
  RawChainConfig,
  RawConfig,
  RawDepositContractConfig,
  RawPoolContractConfig,
  RawProviderConfig,
} from '../../src';

let config: RawChainConfig;
let providerConfig: RawProviderConfig;
let depositContractConfig: RawDepositContractConfig;
let poolContractConfig: RawPoolContractConfig;
let assetConfig: RawAssetConfig;

function initProviderConfig(): Promise<RawProviderConfig> {
  return RawConfig.createFromObject(RawProviderConfig, {
    url: 'wss://ropsten.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    timeoutMs: 5000,
    maxTryCount: 5,
  });
}

function initDepositContractConfig(): Promise<RawDepositContractConfig> {
  return RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    type: ContractType.DEPOSIT,
    startBlock: 1000000,
    bridgeType: BridgeType.TBRIDGE,
    poolAddress: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    disabled: true,
    peerChainId: 97,
    peerContractAddress: '0x98bF2d9e3bA2A8515E660BD4104432ce3e2D7547',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
}

function initPoolContractConfig(): Promise<RawPoolContractConfig> {
  return RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    type: ContractType.POOL,
    startBlock: 1000000,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
    circuits: ['circuit-1.0'],
  });
}

function initAssetsConfig(): Promise<RawAssetConfig> {
  return RawConfig.createFromObject(RawAssetConfig, {
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
  });
}

beforeEach(async () => {
  providerConfig = await initProviderConfig();
  depositContractConfig = await initDepositContractConfig();
  poolContractConfig = await initPoolContractConfig();
  assetConfig = await initAssetsConfig();
  config = await RawConfig.createFromObject(RawChainConfig, {
    chainId: 3,
    name: 'Ethereum Ropsten',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    recommendedAmounts: ['1000000000000000000', '10000000000000000000'],
    explorerUrl: 'https://ropsten.etherscan.io',
    explorerPrefix: '/tx/%tx%',
    providers: [providerConfig],
    signerEndpoint: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    depositContracts: [depositContractConfig],
    poolContracts: [poolContractConfig],
    assets: [assetConfig],
  });
});

test('test invalid chainId', async () => {
  config.chainId = -1;
  await expect(config.validate()).rejects.toThrow();
  config.chainId = 1.4;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid name', async () => {
  config.name = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid assetSymbol', async () => {
  config.assetSymbol = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid assetDecimals', async () => {
  config.assetDecimals = 0;
  await expect(config.validate()).rejects.toThrow();
  config.assetDecimals = 23.4;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid recommendedAmounts', async () => {
  config.recommendedAmounts = [''];
  await expect(config.validate()).rejects.toThrow();
  config.recommendedAmounts = ['abcd'];
  await expect(config.validate()).rejects.toThrow();
  config.recommendedAmounts = ['1', '1'];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid explorerUrl', async () => {
  config.explorerUrl = '';
  await expect(config.validate()).rejects.toThrow();
  config.explorerUrl = 'wrong url';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid explorerPrefix', async () => {
  config.explorerUrl = '';
  await expect(config.validate()).rejects.toThrow();
  config.explorerUrl = 'wrong prefix';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid providers', async () => {
  config.providers = [];
  await expect(config.validate()).rejects.toThrow();
  providerConfig.url = 'wrong url';
  config.providers = [providerConfig];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid signerEndpoint', async () => {
  config.signerEndpoint = '';
  await expect(config.validate()).rejects.toThrow();
  config.signerEndpoint = 'wrong url';
  await expect(config.validate()).rejects.toThrow();
  config.signerEndpoint = 'wrong_schema://127.0.0.1';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid eventFilterSize', async () => {
  config.eventFilterSize = 0;
  await expect(config.validate()).rejects.toThrow();
  config.eventFilterSize = 2.3;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid poolContracts', async () => {
  config.poolContracts = [poolContractConfig, poolContractConfig];
  await expect(config.validate()).rejects.toThrow();
  poolContractConfig.assetAddress = '0xdeadbeef';
  config.poolContracts = [poolContractConfig];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid depositContracts', async () => {
  config.depositContracts = [depositContractConfig, depositContractConfig];
  await expect(config.validate()).rejects.toThrow();
  depositContractConfig.peerChainId = 3.4;
  config.depositContracts = [depositContractConfig];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid assets', async () => {
  config.assets = [assetConfig, assetConfig];
  await expect(config.validate()).rejects.toThrow();
  assetConfig.assetDecimals = 1.2;
  config.assets = [assetConfig];
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(RawChainConfig, 'tests/files/chain.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(RawConfig.createFromFile(RawChainConfig, 'tests/files/chain.invalid.json')).rejects.toThrow();
});
