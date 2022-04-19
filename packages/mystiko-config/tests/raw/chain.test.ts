import { validate } from 'class-validator';
import {
  BridgeType,
  ContractType,
  RawChainConfig,
  RawDepositContractConfig,
  RawPoolContractConfig,
  RawProviderConfig,
  readRawConfigFromFile,
} from '../../src';

let config: RawChainConfig;
let providerConfig: RawProviderConfig;
let depositContractConfig: RawDepositContractConfig;
let poolContractConfig: RawPoolContractConfig;

function initProviderConfig(): RawProviderConfig {
  const conf = new RawProviderConfig();
  conf.url = 'wss://ropsten.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161';
  conf.timeoutMs = 5000;
  conf.maxTryCount = 5;
  return conf;
}

function initDepositContractConfig(): RawDepositContractConfig {
  const conf = new RawDepositContractConfig();
  conf.version = 2;
  conf.name = 'MystikoWithPolyERC20';
  conf.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
  conf.type = ContractType.DEPOSIT;
  conf.startBlock = 1000000;
  conf.bridgeType = BridgeType.TBRIDGE;
  conf.poolAddress = '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d';
  conf.disabled = true;
  conf.peerChainId = 97;
  conf.peerContractAddress = '0x98bF2d9e3bA2A8515E660BD4104432ce3e2D7547';
  conf.minAmount = '1';
  conf.minBridgeFee = '2';
  conf.minExecutorFee = '3';
  return conf;
}

function initPoolContractConfig(): RawPoolContractConfig {
  const conf = new RawPoolContractConfig();
  conf.version = 2;
  conf.name = 'CommitmentPool';
  conf.address = '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d';
  conf.type = ContractType.POOL;
  conf.startBlock = 1000000;
  conf.assetSymbol = 'MTT';
  conf.assetDecimals = 16;
  conf.assetAddress = '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a';
  conf.minRollupFee = '12345';
  conf.circuits = ['circuit-1.0'];
  return conf;
}

beforeEach(() => {
  providerConfig = initProviderConfig();
  depositContractConfig = initDepositContractConfig();
  poolContractConfig = initPoolContractConfig();
  config = new RawChainConfig();
  config.chainId = 3;
  config.name = 'Ethereum Ropsten';
  config.assetSymbol = 'ETH';
  config.assetDecimals = 18;
  config.explorerUrl = 'https://ropsten.etherscan.io';
  config.explorerPrefix = '/tx/%tx%';
  config.providers = [providerConfig];
  config.signerEndpoint = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
  config.depositContracts = [depositContractConfig];
  config.poolContracts = [poolContractConfig];
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid chainId', async () => {
  config.chainId = -1;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.chainId = 1.4;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid name', async () => {
  config.name = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid assetSymbol', async () => {
  config.assetSymbol = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid assetDecimals', async () => {
  config.assetDecimals = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.assetDecimals = 23.4;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid explorerUrl', async () => {
  config.explorerUrl = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.explorerUrl = 'wrong url';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid explorerPrefix', async () => {
  config.explorerUrl = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.explorerUrl = 'wrong prefix';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid providers', async () => {
  config.providers = [];
  expect((await validate(config)).length).toBeGreaterThan(0);
  providerConfig.url = 'wrong url';
  config.providers = [providerConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid signerEndpoint', async () => {
  config.signerEndpoint = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.signerEndpoint = 'wrong url';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.signerEndpoint = 'wrong_schema://127.0.0.1';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid poolContracts', async () => {
  config.poolContracts = [poolContractConfig, poolContractConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
  poolContractConfig.assetDecimals = 1.2;
  config.poolContracts = [poolContractConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid depositContracts', async () => {
  config.depositContracts = [depositContractConfig, depositContractConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
  depositContractConfig.peerChainId = 3.4;
  config.depositContracts = [depositContractConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid eventFilterSize', async () => {
  config.eventFilterSize = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.eventFilterSize = 2.3;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawChainConfig, 'tests/files/chain.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(readRawConfigFromFile(RawChainConfig, 'tests/files/chain.invalid.json')).rejects.toThrow();
});
