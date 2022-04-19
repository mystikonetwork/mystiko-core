import {
  CircuitConfig,
  CircuitType,
  PoolContractConfig,
  RawConfig,
  RawMystikoConfig,
  RawPoolContractConfig,
} from '../../../src';

let rawConfig: RawPoolContractConfig;
let defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
let circuitConfigsByName: Map<string, CircuitConfig>;
let config: PoolContractConfig;

async function initCircuitConfigsByName(): Promise<Map<string, CircuitConfig>> {
  const mystikoConfig = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
  const configs = new Map<string, CircuitConfig>();
  mystikoConfig.circuits.forEach((rawCircuitConfig) => {
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
  config = new PoolContractConfig(rawConfig, defaultCircuitConfigs, circuitConfigsByName);
});

test('test equality', () => {
  expect(config.assetSymbol).toBe(rawConfig.assetSymbol);
  expect(config.assetDecimals).toBe(rawConfig.assetDecimals);
  expect(config.assetAddress).toBe(rawConfig.assetAddress);
  expect(config.minRollupFee.toString()).toBe(rawConfig.minRollupFee);
  expect(config.minRollupFeeNumber).toBe(12);
  expect(config.circuits.sort()).toEqual(Array.from(defaultCircuitConfigs.values()).sort());
});

test('test circuit overwrite', () => {
  expect(config.getCircuitConfig(CircuitType.ROLLUP1)?.name).toBe('zokrates-1.0-rollup1');
  rawConfig.circuits = ['zokrates-2.0-rollup1'];
  config = new PoolContractConfig(rawConfig, defaultCircuitConfigs, circuitConfigsByName);
  expect(config.getCircuitConfig(CircuitType.ROLLUP1)?.name).toBe('zokrates-2.0-rollup1');
  expect(config.getCircuitConfig(CircuitType.ROLLUP4)?.name).toBe('zokrates-1.0-rollup4');
});

test('test copy', () => {
  expect(
    new PoolContractConfig(config.copyData(), defaultCircuitConfigs, circuitConfigsByName),
  ).toStrictEqual(config);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawPoolContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
