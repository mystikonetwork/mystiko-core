import { validate } from 'class-validator';
import { CircuitConfig, CircuitType, readConfigFromFile } from '../src';

let config: CircuitConfig;

beforeEach(() => {
  config = new CircuitConfig();
  config.name = 'zokrates-1.0-rollup1';
  config.type = CircuitType.ROLLUP1;
  config.programFile = ['./Rollup1.program.gz'];
  config.abiFile = ['./Rollup1.abi.json'];
  config.provingKeyFile = ['./Rollup1.pkey.gz'];
  config.verifyingKeyFile = ['./Rollup1.vkey.gz'];
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
});

test('test invalid name', async () => {
  config.name = '';
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid programFile', async () => {
  config.programFile = [''];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid abiFile', async () => {
  config.abiFile = [''];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid provingKeyFile', async () => {
  config.provingKeyFile = [''];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test invalid verifyingKeyFile', async () => {
  config.verifyingKeyFile = [''];
  expect((await validate(config)).length).toBeGreaterThan(0);
});

test('test import json file', async () => {
  const fileConfig = await readConfigFromFile(CircuitConfig, 'tests/files/circuit.valid.json');
  expect(fileConfig).toStrictEqual(config);
  await expect(readConfigFromFile(CircuitConfig, 'tests/files/circuit.invalid.json')).rejects.toThrow();
});
