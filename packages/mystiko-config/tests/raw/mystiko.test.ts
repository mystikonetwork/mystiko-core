import { RawConfig, RawMystikoConfig } from '../../src';

let config: RawMystikoConfig;

beforeEach(async () => {
  config = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
});

test('test invalid version', async () => {
  config.version = '';
  await expect(config.validate()).rejects.toThrow();
  config.version = 'wrong version';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid chains', async () => {
  const chainConfigs = config.chains;
  config.chains = [...chainConfigs, ...chainConfigs];
  await expect(config.validate()).rejects.toThrow();
  chainConfigs[0].chainId = 1.2;
  config.chains = chainConfigs;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid bridges', async () => {
  const bridgeConfigs = config.bridges;
  config.bridges = [...bridgeConfigs, ...bridgeConfigs];
  await expect(config.validate()).rejects.toThrow();
  bridgeConfigs[0].name = '';
  config.bridges = bridgeConfigs;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid circuits', async () => {
  const circuitConfigs = config.circuits;
  config.circuits = [...circuitConfigs, ...circuitConfigs];
  await expect(config.validate()).rejects.toThrow();
  circuitConfigs[0].name = '';
  config.circuits = circuitConfigs;
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid json file', async () => {
  await expect(
    RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.invalid.json'),
  ).rejects.toThrow();
});
