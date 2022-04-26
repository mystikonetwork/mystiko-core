import { ContractType, RawConfig, RawPoolContractConfig } from '../../../src';

let config: RawPoolContractConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    startBlock: 1000000,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '120000000000000000',
    circuits: ['circuit-1.0'],
  });
});

test('test validate success', async () => {
  config.assetAddress = undefined;
  config.minRollupFee = '0';
  config.circuits = [];
  await config.validate();
});

test('test invalid type', async () => {
  config.type = ContractType.DEPOSIT;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid minRollupFee', async () => {
  config.minRollupFee = '';
  await expect(config.validate()).rejects.toThrow();
  config.minRollupFee = '0xdeadbeef';
  await expect(config.validate()).rejects.toThrow();
  config.minRollupFee = '-1';
  await expect(config.validate()).rejects.toThrow();
  config.minRollupFee = '1.2';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid circuits', async () => {
  config.circuits = [''];
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(
    RawPoolContractConfig,
    'tests/files/contract/pool.valid.json',
  );
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawPoolContractConfig, 'tests/files/contract/pool.invalid.json'),
  ).rejects.toThrow();
});
