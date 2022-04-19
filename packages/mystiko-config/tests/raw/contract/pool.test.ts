import { validate } from 'class-validator';
import { ContractType, RawPoolContractConfig, readRawConfigFromFile } from '../../../src';

let config: RawPoolContractConfig;

beforeEach(() => {
  config = new RawPoolContractConfig();
  config.version = 2;
  config.name = 'CommitmentPool';
  config.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
  config.type = ContractType.POOL;
  config.startBlock = 1000000;
  config.assetSymbol = 'MTT';
  config.assetDecimals = 16;
  config.assetAddress = '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a';
  config.minRollupFee = '120000000000000000';
  config.circuits = ['circuit-1.0'];
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  config.assetAddress = undefined;
  config.minRollupFee = '0';
  config.circuits = [];
  expect((await validate(config)).length).toBe(0);
});

test('test invalid type', async () => {
  config.type = ContractType.DEPOSIT;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid assetSymbol', async () => {
  config.assetSymbol = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid assetDecimals', async () => {
  config.assetDecimals = -1;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.assetDecimals = 16.5;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid assetAddress', async () => {
  config.assetAddress = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.assetAddress = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid minRollupFee', async () => {
  config.minRollupFee = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minRollupFee = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minRollupFee = '-1';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.minRollupFee = '1.2';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid circuits', async () => {
  config.circuits = [''];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(
    RawPoolContractConfig,
    'tests/files/contract/pool.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawPoolContractConfig, 'tests/files/contract/pool.invalid.json'),
  ).rejects.toThrow();
});
