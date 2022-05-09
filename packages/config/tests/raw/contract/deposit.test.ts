import { BridgeType, ContractType, RawConfig, RawDepositContractConfig } from '../../../src';

let config: RawDepositContractConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    startBlock: 1000000,
    bridgeType: BridgeType.TBRIDGE,
    poolAddress: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    disabled: true,
    peerChainId: 97,
    peerContractAddress: '0x98bF2d9e3bA2A8515E660BD4104432ce3e2D7547',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
    bridgeFeeAssetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    executorFeeAssetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
  });
});

test('test invalid type', async () => {
  config.type = ContractType.POOL;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid poolAddress', async () => {
  config.poolAddress = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.poolAddress = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid peerChainId', async () => {
  config.peerChainId = -1;
  await expect(config.validate()).rejects.toThrow();
  config.peerChainId = 1.2;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid peerContractAddress', async () => {
  config.peerContractAddress = '';
  await expect(config.validate()).rejects.toThrow();
  config.peerContractAddress = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid minAmount', async () => {
  config.minAmount = '';
  await expect(config.validate()).rejects.toThrow();
  config.minAmount = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.minAmount = '-1';
  await expect(config.validate()).rejects.toThrow();
  config.minAmount = '1.2';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid minBridgeFee', async () => {
  config.minBridgeFee = '';
  await expect(config.validate()).rejects.toThrow();
  config.minBridgeFee = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.minBridgeFee = '-1';
  await expect(config.validate()).rejects.toThrow();
  config.minBridgeFee = '1.2';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid minExecutorFee', async () => {
  config.minExecutorFee = '';
  await expect(config.validate()).rejects.toThrow();
  config.minExecutorFee = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.minExecutorFee = '-1';
  await expect(config.validate()).rejects.toThrow();
  config.minExecutorFee = '1.2';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid executorFeeAssetAddress', async () => {
  config.bridgeFeeAssetAddress = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.bridgeFeeAssetAddress = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid executorFeeAssetAddress', async () => {
  config.bridgeFeeAssetAddress = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.bridgeFeeAssetAddress = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawDepositContractConfig,
    'tests/files/contract/deposit.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawDepositContractConfig, 'tests/files/contract/deposit.invalid.json'),
  ).rejects.toThrow();
});
