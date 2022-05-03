import { CircuitConfig, RawCircuitConfig, RawConfig } from '../../src';

let rawConfig: RawCircuitConfig;
let config: CircuitConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawCircuitConfig, 'tests/files/circuit.valid.json');
  config = new CircuitConfig(rawConfig);
});

test('test equality', () => {
  expect(config.name).toBe(rawConfig.name);
  expect(config.type).toBe(rawConfig.type);
  expect(config.isDefault).toBe(rawConfig.isDefault);
  expect(config.programFile).toStrictEqual(rawConfig.programFile);
  expect(config.abiFile).toStrictEqual(rawConfig.abiFile);
  expect(config.provingKeyFile).toStrictEqual(rawConfig.provingKeyFile);
  expect(config.verifyingKeyFile).toStrictEqual(rawConfig.verifyingKeyFile);
});

test('test copy', () => {
  expect(new CircuitConfig(config.copyData())).toStrictEqual(config);
});

test('test mutate', () => {
  expect(config.mutate()).toStrictEqual(config);
  rawConfig.name = 'another name';
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawCircuitConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
