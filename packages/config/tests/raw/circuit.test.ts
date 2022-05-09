import { RawCircuitConfig, CircuitType, RawConfig } from '../../src';

let config: RawCircuitConfig;

beforeEach(async () => {
  config = await RawConfig.createFromObject(RawCircuitConfig, {
    name: 'zokrates-1.0-rollup1',
    type: CircuitType.ROLLUP1,
    isDefault: true,
    programFile: ['./Rollup1.program.gz'],
    abiFile: ['./Rollup1.abi.json'],
    provingKeyFile: ['./Rollup1.pkey.gz'],
    verifyingKeyFile: ['./Rollup1.vkey.gz'],
  });
});

test('test invalid name', async () => {
  config.name = '';
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid programFile', async () => {
  config.programFile = [''];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid abiFile', async () => {
  config.abiFile = [''];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid provingKeyFile', async () => {
  config.provingKeyFile = [''];
  await expect(config.validate()).rejects.toThrow();
});

test('test invalid verifyingKeyFile', async () => {
  config.verifyingKeyFile = [''];
  await expect(config.validate()).rejects.toThrow();
});

test('test import json file', async () => {
  const fileConfig = await RawConfig.createFromFile(RawCircuitConfig, 'tests/files/circuit.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(
    RawConfig.createFromFile(RawCircuitConfig, 'tests/files/circuit.invalid.json'),
  ).rejects.toThrow();
});
