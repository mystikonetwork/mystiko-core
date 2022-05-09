import {
  AssetConfig,
  AssetType,
  BridgeType,
  CircuitConfig,
  CircuitType,
  DepositContractConfig,
  MAIN_ASSET_ADDRESS,
  PoolContractConfig,
  RawAssetConfig,
  RawConfig,
  RawDepositContractConfig,
  RawMystikoConfig,
} from '../../../src';

let rawConfig: RawDepositContractConfig;
let config: DepositContractConfig;
let rawMystikoConfig: RawMystikoConfig;
let defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
let circuitConfigsByName: Map<string, CircuitConfig>;
let mainAssetConfig: AssetConfig;
let assetConfigs: Map<string, AssetConfig>;

beforeEach(async () => {
  rawMystikoConfig = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
  circuitConfigsByName = new Map<string, CircuitConfig>();
  defaultCircuitConfigs = new Map<CircuitType, CircuitConfig>();
  rawMystikoConfig.circuits.forEach((rawCircuitConfig) => {
    const circuitConfig = new CircuitConfig(rawCircuitConfig);
    circuitConfigsByName.set(rawCircuitConfig.name, circuitConfig);
    if (rawCircuitConfig.isDefault) {
      defaultCircuitConfigs.set(rawCircuitConfig.type, circuitConfig);
    }
  });
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
  rawConfig = await RawConfig.createFromFile(
    RawDepositContractConfig,
    'tests/files/contract/deposit.valid.json',
  );
  rawConfig.bridgeType = BridgeType.LOOP;
  rawConfig.peerChainId = undefined;
  rawConfig.peerContractAddress = undefined;
  expect(() => new DepositContractConfig(rawConfig)).toThrow(new Error('auxData has not been specified'));
  config = new DepositContractConfig(rawConfig, {
    poolContractGetter: () =>
      new PoolContractConfig(rawMystikoConfig.chains[0].poolContracts[0], {
        defaultCircuitConfigs,
        circuitConfigsByName,
        mainAssetConfig,
        assetConfigs,
      }),
    depositContractGetter: () => undefined,
    mainAssetConfig,
    assetConfigs,
  });
});

test('test equality', () => {
  expect(config.bridgeType).toBe(rawConfig.bridgeType);
  expect(config.poolAddress).toBe(rawConfig.poolAddress);
  expect(config.disabled).toBe(rawConfig.disabled);
  expect(config.minAmount.toString()).toBe(rawConfig.minAmount);
  expect(config.minAmountNumber).toBe(1);
  expect(config.minBridgeFee.toString()).toBe(rawConfig.minBridgeFee);
  expect(config.minBridgeFeeNumber).toBe(2);
  expect(config.minExecutorFee.toString()).toBe(rawConfig.minExecutorFee);
  expect(config.minExecutorFeeNumber).toBe(3);
  expect(config.asset).toStrictEqual(assetConfigs.get('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a'));
  expect(config.assetType).toBe(AssetType.ERC20);
  expect(config.assetSymbol).toBe('MTT');
  expect(config.assetDecimals).toBe(16);
  expect(config.assetAddress).toBe('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a');
  expect(config.recommendedAmounts.map((a) => a.toString())).toStrictEqual([
    '10000000000000000',
    '100000000000000000',
  ]);
  expect(config.recommendedAmountsNumber).toStrictEqual([1, 10]);
  expect(config.minRollupFee.toString()).toBe('40000000000000000');
  expect(config.minRollupFeeNumber).toBe(4);
  expect(config.circuits.map((conf) => conf.name)).toContain('zokrates-2.0-rollup1');
  expect(config.poolContract.address).toBe(rawConfig.poolAddress);
  expect(config.peerContract).toBe(undefined);
  expect(config.bridgeFeeAsset).toStrictEqual(assetConfigs.get('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a'));
  expect(config.executorFeeAsset).toStrictEqual(
    assetConfigs.get('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a'),
  );
});

test('test bridgeFeeAsset', () => {
  rawConfig.bridgeFeeAssetAddress = undefined;
  config = config.mutate(rawConfig);
  expect(config.bridgeFeeAsset).toStrictEqual(mainAssetConfig);
  rawConfig.bridgeFeeAssetAddress = '0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9';
  expect(() => config.mutate(rawConfig)).toThrow(
    new Error(
      'bridge fee asset address=0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9 config ' +
        `has not been defined for deposit contract address=${rawConfig.address}`,
    ),
  );
  rawConfig.bridgeFeeAssetAddress = MAIN_ASSET_ADDRESS;
  config = config.mutate(rawConfig);
  expect(config.bridgeFeeAsset).toStrictEqual(mainAssetConfig);
});

test('test executorFeeAsset', () => {
  rawConfig.executorFeeAssetAddress = undefined;
  config = config.mutate(rawConfig);
  expect(config.executorFeeAsset).toStrictEqual(config.asset);
  rawConfig.executorFeeAssetAddress = '0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9';
  expect(() => config.mutate(rawConfig)).toThrow(
    new Error(
      'executor fee asset address=0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9 config ' +
        `has not been defined for deposit contract address=${rawConfig.address}`,
    ),
  );
  rawConfig.executorFeeAssetAddress = MAIN_ASSET_ADDRESS;
  config = config.mutate(rawConfig);
  expect(config.executorFeeAsset).toStrictEqual(mainAssetConfig);
});

test('test peerContract', () => {
  const peerContractConfig = new DepositContractConfig(rawMystikoConfig.chains[1].depositContracts[0], {
    poolContractGetter: () => undefined,
    depositContractGetter: () => undefined,
    mainAssetConfig,
    assetConfigs,
  });
  rawConfig.bridgeType = BridgeType.TBRIDGE;
  rawConfig.peerChainId = 97;
  rawConfig.peerContractAddress = '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9';
  config = new DepositContractConfig(rawConfig, {
    poolContractGetter: () => undefined,
    depositContractGetter: () => peerContractConfig,
    mainAssetConfig,
    assetConfigs,
  });
  expect(config.peerContract?.address).toBe('0xd791049D0a154bC7860804e1A18ACD148Eb0afD9');
});

test('test invalid rawConfig', () => {
  rawConfig.bridgeType = BridgeType.TBRIDGE;
  expect(
    () =>
      new DepositContractConfig(rawConfig, {
        poolContractGetter: () => undefined,
        depositContractGetter: () => undefined,
        mainAssetConfig,
        assetConfigs,
      }),
  ).toThrow();
  rawConfig.bridgeType = BridgeType.LOOP;
  rawConfig.peerContractAddress = '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9';
  expect(
    () =>
      new DepositContractConfig(rawConfig, {
        poolContractGetter: () => undefined,
        depositContractGetter: () => undefined,
        mainAssetConfig,
        assetConfigs,
      }),
  ).toThrow();
  rawConfig.peerContractAddress = undefined;
  rawConfig.peerChainId = 97;
  expect(
    () =>
      new DepositContractConfig(rawConfig, {
        poolContractGetter: () => undefined,
        depositContractGetter: () => undefined,
        mainAssetConfig,
        assetConfigs,
      }),
  ).toThrow();
  rawConfig.peerChainId = undefined;
  config = new DepositContractConfig(rawConfig, {
    poolContractGetter: () => undefined,
    depositContractGetter: () => undefined,
    mainAssetConfig,
    assetConfigs,
  });
  expect(() => config.poolContract).toThrow(
    new Error(`no poolContract definition found for deposit contract=${rawConfig.address}`),
  );
});

test('test copy', () => {
  expect(config.copyData()).toStrictEqual(rawConfig);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.name = 'another name';
  let newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
  newConfig = config.mutate(rawConfig, {
    poolContractGetter: () =>
      new PoolContractConfig(rawMystikoConfig.chains[0].poolContracts[0], {
        defaultCircuitConfigs,
        circuitConfigsByName,
        mainAssetConfig,
        assetConfigs,
      }),
    depositContractGetter: () => undefined,
    mainAssetConfig,
    assetConfigs,
  });
  expect(newConfig.copyData()).toStrictEqual(rawConfig);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawDepositContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
