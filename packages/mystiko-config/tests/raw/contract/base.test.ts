import { RawContractConfig, ContractType, RawConfig } from '../../../src';

let config: RawContractConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    type: ContractType.DEPOSIT,
    startBlock: 1000000,
    eventFilterSize: 10000,
  });
});

test('test validate success', async () => {
  config.eventFilterSize = undefined;
  await config.validate();
});

test('test invalid version', async () => {
  config.version = 0;
  await expect(config.validate()).rejects.toThrow();
  config.version = 0.1;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid name', async () => {
  config.name = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid address', async () => {
  config.address = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.address = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid startBlock', async () => {
  config.startBlock = 0;
  await expect(config.validate()).rejects.toThrow();
  config.startBlock = 1.2;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid eventFilterSize', async () => {
  config.eventFilterSize = 0;
  await expect(config.validate()).rejects.toThrow();
  config.eventFilterSize = 1.2;
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawContractConfig,
    'tests/files/contract/base.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawContractConfig, 'tests/files/contract/base.invalid.json'),
  ).rejects.toThrow();
});
