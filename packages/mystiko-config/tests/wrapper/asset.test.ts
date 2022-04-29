import { AssetConfig, AssetType, MAIN_ASSET_ADDRESS, RawAssetConfig, RawConfig } from '../../src';

let rawConfig: RawAssetConfig;
let config: AssetConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawAssetConfig, 'tests/files/asset.valid.json');
  config = new AssetConfig(rawConfig);
});

test('test equality', () => {
  expect(config.assetAddress).toBe(rawConfig.assetAddress);
  expect(config.assetType).toBe(rawConfig.assetType);
  expect(config.assetDecimals).toBe(rawConfig.assetDecimals);
  expect(config.assetSymbol).toBe(rawConfig.assetSymbol);
  expect(config.recommendedAmounts.map((a) => a.toString())).toStrictEqual(rawConfig.recommendedAmounts);
  expect(config.recommendedAmountsNumber).toStrictEqual([1, 10]);
});

test('test wrong address or type', () => {
  rawConfig.assetAddress = MAIN_ASSET_ADDRESS;
  rawConfig.assetType = AssetType.ERC20;
  expect(() => new AssetConfig(rawConfig)).toThrow(
    new Error(`wrong asset address=${MAIN_ASSET_ADDRESS} and type=${AssetType.ERC20}`),
  );
  rawConfig.assetAddress = '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a';
  rawConfig.assetType = AssetType.MAIN;
  expect(() => new AssetConfig(rawConfig)).toThrow(
    new Error(`wrong asset address=0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a and type=${AssetType.MAIN}`),
  );
});

test('test copy', () => {
  expect(new AssetConfig(config.copyData())).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.assetDecimals = 6;
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.assetDecimals).toBe(6);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawAssetConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
