import { validate } from 'class-validator';
import { RawMystikoConfig, readRawConfigFromFile } from '../../src';

let config: RawMystikoConfig;

beforeEach(async () => {
  config = await readRawConfigFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
});

test('test invalid version', async () => {
  config.version = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
  config.version = 'wrong version';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid chains', async () => {
  const chainConfigs = config.chains;
  config.chains = [...chainConfigs, ...chainConfigs];
  expect((await validate(config)).length).toBeGreaterThan(0);
  chainConfigs[0].chainId = 1.2;
  config.chains = chainConfigs;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid bridges', async () => {
  const bridgeConfigs = config.bridges;
  config.bridges = [...bridgeConfigs, ...bridgeConfigs];
  expect((await validate(config)).length).toBeGreaterThan(0);
  bridgeConfigs[0].name = '';
  config.bridges = bridgeConfigs;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid circuits', async () => {
  const circuitConfigs = config.circuits;
  config.circuits = [...circuitConfigs, ...circuitConfigs];
  expect((await validate(config)).length).toBeGreaterThan(0);
  circuitConfigs[0].name = '';
  config.circuits = circuitConfigs;
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid json file', async () => {
  await expect(readRawConfigFromFile(RawMystikoConfig, 'tests/files/mystiko.invalid.json')).rejects.toThrow();
});
