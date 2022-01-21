import { CircuitConfig } from '../../src/config/circuitConfig.js';

test('test basic', () => {
  const rawConfig = {};
  expect(() => new CircuitConfig(rawConfig)).toThrow();
  rawConfig['name'] = 'circom-1.0';
  expect(() => new CircuitConfig(rawConfig)).toThrow();
  rawConfig['wasmFile'] = 'file.wasm';
  expect(() => new CircuitConfig(rawConfig)).toThrow();
  rawConfig['zkeyFile'] = 'file.zkey';
  expect(() => new CircuitConfig(rawConfig)).toThrow();
  rawConfig['vkeyFile'] = 'file.vkey.json';
  const config = new CircuitConfig(rawConfig);
  expect(config.name).toBe('circom-1.0');
  expect(config.wasmFile).toBe('file.wasm');
  expect(config.zkeyFile).toBe('file.zkey');
  expect(config.vkeyFile).toBe('file.vkey.json');
});
