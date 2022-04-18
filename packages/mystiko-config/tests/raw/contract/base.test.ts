import { validate } from 'class-validator';
import { RawContractConfig, ContractType, readRawConfigFromFile } from '../../../src';

let config: RawContractConfig;

beforeEach(() => {
  config = new RawContractConfig();
  config.version = 2;
  config.name = 'MystikoWithPolyERC20';
  config.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
  config.type = ContractType.DEPOSIT;
  config.startBlock = 1000000;
  config.eventFilterSize = 10000;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  config.eventFilterSize = undefined;
  expect((await validate(config)).length).toBe(0);
});

test('test invalid version', async () => {
  config.version = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.version = 0.1;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid name', async () => {
  config.name = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid address', async () => {
  config.address = '0xdeadbeef';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.address = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid startBlock', async () => {
  config.startBlock = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.startBlock = 1.2;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid eventFilterSize', async () => {
  config.eventFilterSize = 0;
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.eventFilterSize = 1.2;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readRawConfigFromFile(RawContractConfig, 'tests/files/contract/base.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    readRawConfigFromFile(RawContractConfig, 'tests/files/contract/base.invalid.json'),
  ).rejects.toThrow();
});
