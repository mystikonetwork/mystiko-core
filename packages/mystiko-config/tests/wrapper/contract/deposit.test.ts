import {
  BridgeType,
  CircuitConfig,
  CircuitType,
  DepositContractConfig,
  PoolContractConfig,
  RawConfig,
  RawDepositContractConfig,
  RawMystikoConfig,
} from '../../../src';

let rawConfig: RawDepositContractConfig;
let config: DepositContractConfig;
let rawMystikoConfig: RawMystikoConfig;
let defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
let circuitConfigsByName: Map<string, CircuitConfig>;

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
  rawConfig = await RawConfig.createFromFile(
    RawDepositContractConfig,
    'tests/files/contract/deposit.valid.json',
  );
  rawConfig.bridgeType = BridgeType.LOOP;
  rawConfig.peerChainId = undefined;
  rawConfig.peerContractAddress = undefined;
  config = new DepositContractConfig(
    rawConfig,
    () =>
      new PoolContractConfig(
        rawMystikoConfig.chains[0].poolContracts[0],
        defaultCircuitConfigs,
        circuitConfigsByName,
      ),
    () => undefined,
  );
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
  expect(config.assetSymbol).toBe('MTT');
  expect(config.assetDecimals).toBe(16);
  expect(config.assetAddress).toBe('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a');
  expect(config.minRollupFee.toString()).toBe('40000000000000000');
  expect(config.minRollupFeeNumber).toBe(4);
  expect(config.circuits.map((conf) => conf.name)).toContain('zokrates-2.0-rollup1');
  expect(config.poolContract.address).toBe(rawConfig.poolAddress);
  expect(config.peerContract).toBe(undefined);
});

test('test peerContract', () => {
  const peerContractConfig = new DepositContractConfig(
    rawMystikoConfig.chains[1].depositContracts[0],
    () => undefined,
    () => undefined,
  );
  rawConfig.bridgeType = BridgeType.TBRIDGE;
  rawConfig.peerChainId = 97;
  rawConfig.peerContractAddress = '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9';
  config = new DepositContractConfig(
    rawConfig,
    () => undefined,
    () => peerContractConfig,
  );
  expect(config.peerContract?.address).toBe('0xd791049D0a154bC7860804e1A18ACD148Eb0afD9');
});

test('test invalid rawConfig', () => {
  rawConfig.bridgeType = BridgeType.TBRIDGE;
  expect(
    () =>
      new DepositContractConfig(
        rawConfig,
        () => undefined,
        () => undefined,
      ),
  ).toThrow();
  rawConfig.bridgeType = BridgeType.LOOP;
  rawConfig.peerContractAddress = '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9';
  expect(
    () =>
      new DepositContractConfig(
        rawConfig,
        () => undefined,
        () => undefined,
      ),
  ).toThrow();
  rawConfig.peerContractAddress = undefined;
  rawConfig.peerChainId = 97;
  expect(
    () =>
      new DepositContractConfig(
        rawConfig,
        () => undefined,
        () => undefined,
      ),
  ).toThrow();
  rawConfig.peerChainId = undefined;
  config = new DepositContractConfig(
    rawConfig,
    () => undefined,
    () => undefined,
  );
  expect(() => config.poolContract).toThrow(
    new Error(`no poolContract definition found for deposit contract=${rawConfig.address}`),
  );
});

test('test copy', () => {
  expect(config.copyData()).toStrictEqual(rawConfig);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawDepositContractConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
