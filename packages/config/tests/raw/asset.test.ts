import { RawAssetConfig, RawConfig } from '../../src';

let config: RawAssetConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawAssetConfig, {
    assetType: 'erc20',
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    recommendedAmounts: ['10000000000000000', '100000000000000000'],
  });
});

test('test invalid assetSymbol', async () => {
  config.assetSymbol = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid assetDecimals', async () => {
  config.assetDecimals = -1;
  await expect(config.validate()).rejects.toThrow();
  config.assetDecimals = 16.5;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid assetAddress', async () => {
  config.assetAddress = '';
  await expect(config.validate()).rejects.toThrow();
  config.assetAddress = '0xdeadbeef';
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

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(RawAssetConfig, 'tests/files/asset.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(RawConfig.createFromFile(RawAssetConfig, 'tests/files/asset.invalid.json')).rejects.toThrow();
});
