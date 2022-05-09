import {
  AssetConfig,
  AssetType,
  CircuitConfig,
  CircuitType,
  PoolContractConfig,
  RawAssetConfig,
  RawConfig,
  RawMystikoConfig,
  RawPoolContractConfig,
} from '../../../src';

let rawMystikoConfig: RawMystikoConfig;
let rawConfig: RawPoolContractConfig;
let defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
let circuitConfigsByName: Map<string, CircuitConfig>;
let config: PoolContractConfig;
let mainAssetConfig: AssetConfig;
let assetConfigs: Map<string, AssetConfig>;

async function initCircuitConfigsByName(): Promise<Map<string, CircuitConfig>> {
  rawMystikoConfig = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
  const configs = new Map<string, CircuitConfig>();
  rawMystikoConfig.circuits.forEach((rawCircuitConfig) => {
    const circuitConfig = new CircuitConfig(rawCircuitConfig);
    configs.set(rawCircuitConfig.name, circuitConfig);
  });
  return configs;
}

function initDefaultCircuitConfigs(): Map<CircuitType, CircuitConfig> {
  const defaultConfigs = new Map<CircuitType, CircuitConfig>();
  circuitConfigsByName.forEach((circuitConfig) => {
    if (circuitConfig.isDefault) {
      defaultConfigs.set(circuitConfig.type, circuitConfig);
    }
  });
  return defaultConfigs;
}

beforeEach(async () => {
  circuitConfigsByName = await initCircuitConfigsByName();
  defaultCircuitConfigs = initDefaultCircuitConfigs();
  rawConfig = await RawConfig.createFromFile(RawPoolContractConfig, 'tests/files/contract/pool.valid.json');
  mainAssetConfig = new AssetConfig({
    assetType: AssetType.MAIN,
    assetSymbol: rawMystikoConfig.chains[0].assetSymbol,
    assetDecimals: rawMystikoConfig.chains[0].assetDecimals,
    assetAddress: '0x0000000000000000000000000000000000000000',
    recommendedAmounts: rawMystikoConfig.chains[0].recommendedAmounts,
  } as RawAssetConfig);
  assetConfigs = new Map<string, AssetConfig>([
    [
      rawMystikoConfig.chains[0].assets[0].assetAddress,
      new AssetConfig(rawMystikoConfig.chains[0].assets[0]),
    ],
  ]);
  expect(() => new PoolContractConfig(rawConfig)).toThrow(new Error('auxData has not been specified'));
  config = new PoolContractConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    mainAssetConfig,
    assetConfigs,
  });
});

test('test equality', () => {
  expect(config.asset).toStrictEqual(assetConfigs.get('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a'));
  expect(config.assetType).toBe(config.asset.assetType);
  expect(config.assetSymbol).toBe(config.asset.assetSymbol);
  expect(config.assetDecimals).toBe(config.asset.assetDecimals);
  expect(config.assetAddress).toBe(rawConfig.assetAddress);
  expect(config.recommendedAmounts).toStrictEqual(config.asset.recommendedAmounts);
  expect(config.recommendedAmountsNumber).toStrictEqual(config.asset.recommendedAmountsNumber);
  expect(config.minRollupFee.toString()).toBe(rawConfig.minRollupFee);
  expect(config.minRollupFeeNumber).toBe(12);
  expect(config.circuits.sort()).toEqual(Array.from(defaultCircuitConfigs.values()).sort());
});

test('test assetAddress is undefined', () => {
  rawConfig.assetAddress = undefined;
  config = new PoolContractConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    mainAssetConfig,
    assetConfigs,
  });
  expect(config.asset).toStrictEqual(mainAssetConfig);
});

test('test assetAddress is not found', () => {
  rawConfig.assetAddress = '0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9';
  expect(
    () =>
      new PoolContractConfig(rawConfig, {
        defaultCircuitConfigs,
        circuitConfigsByName,
        mainAssetConfig,
        assetConfigs,
      }),
  ).toThrow(
    new Error(
      'asset address=0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9 config ' +
        `has not been defined for pool contract address=${rawConfig.address}`,
    ),
  );
});

test('test circuit overwrite', () => {
  expect(config.getCircuitConfig(CircuitType.ROLLUP1)?.name).toBe('zokrates-1.0-rollup1');
  rawConfig.circuits = ['zokrates-2.0-rollup1'];
  config = new PoolContractConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    mainAssetConfig,
    assetConfigs,
  });
  expect(config.getCircuitConfig(CircuitType.ROLLUP1)?.name).toBe('zokrates-2.0-rollup1');
  expect(config.getCircuitConfig(CircuitType.ROLLUP4)?.name).toBe('zokrates-1.0-rollup4');
});

test('test copy', () => {
  expect(
    new PoolContractConfig(rawConfig, {
      defaultCircuitConfigs,
      circuitConfigsByName,
      mainAssetConfig,
      assetConfigs,
    }),
  ).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.name = 'another name';
  let newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
  newConfig = config.mutate(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    mainAssetConfig,
    assetConfigs,
  });
  expect(newConfig.copyData()).toStrictEqual(rawConfig);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawPoolContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
