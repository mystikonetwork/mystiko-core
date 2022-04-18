import { validate } from 'class-validator';
import {
  BridgeType,
  ContractType,
  RawDepositContractConfig,
  RawPeerContractConfig,
  readRawConfigFromFile,
} from '../../../src';

let config: RawDepositContractConfig;

beforeEach(() => {
  config = new RawDepositContractConfig();
  config.version = 2;
  config.name = 'MystikoWithPolyERC20';
  config.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
  config.type = ContractType.DEPOSIT;
  config.startBlock = 1000000;
  config.bridgeType = BridgeType.TBRIDGE;
  config.poolAddress = '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d';
  config.disabled = true;
  const peerContractConfig = new RawPeerContractConfig();
  peerContractConfig.chainId = 97;
  peerContractConfig.address = '0x98bF2d9e3bA2A8515E660BD4104432ce3e2D7547';
  config.peerChains = [peerContractConfig];
  config.minAmount = '1';
  config.minBridgeFee = '2';
  config.minExecutorFee = '3';
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid type', async () => {
  config.type = ContractType.POOL;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid poolAddress', async () => {
  config.poolAddress = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.poolAddress = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid peerChains', async () => {
  const peerContractConfig = new RawPeerContractConfig();
  peerContractConfig.chainId = 97;
  peerContractConfig.address = '0x98bF2d9e3bA2A8515E660BD4104432ce3e2D7547';
  config.peerChains.push(peerContractConfig);
  expect((await validate(config)).length).toBeGreaterThan(0);
  peerContractConfig.address = '0xdeadbeef';
  config.peerChains = [peerContractConfig];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid minAmount', async () => {
  config.minAmount = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minAmount = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minAmount = '-1';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minAmount = '1.2';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid minBridgeFee', async () => {
  config.minBridgeFee = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minBridgeFee = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minBridgeFee = '-1';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minBridgeFee = '1.2';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid minExecutorFee', async () => {
  config.minExecutorFee = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minExecutorFee = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minExecutorFee = '-1';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minExecutorFee = '1.2';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(
    RawDepositContractConfig,
    'tests/files/contract/deposit.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawDepositContractConfig, 'tests/files/contract/deposit.invalid.json'),
  ).rejects.toThrow();
});
