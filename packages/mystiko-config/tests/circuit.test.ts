import { CircuitConfig } from '../src';

test('test basic', () => {
  const rawConfig1 = {};
  expect(() => new CircuitConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, name: 'circom-1.0' };
  expect(() => new CircuitConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig2, wasmFile: 'file.wasm' };
  expect(() => new CircuitConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig3, zkeyFile: 'file.zkey' };
  expect(() => new CircuitConfig(rawConfig4)).toThrow();
  const rawConfig5 = { ...rawConfig4, vkeyFile: 'file.vkey.json' };
  const config = new CircuitConfig(rawConfig5);
  expect(config.name).toBe('circom-1.0');
  expect(config.wasmFile).toBe('file.wasm');
  expect(config.zkeyFile).toBe('file.zkey');
  expect(config.vkeyFile).toBe('file.vkey.json');
});
