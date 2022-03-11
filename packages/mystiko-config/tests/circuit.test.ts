import { CircuitConfig } from '../src';

test('test basic', () => {
  const rawConfig1 = {};
  expect(() => new CircuitConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, name: 'circom-1.0' };
  expect(() => new CircuitConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig2, wasmFile: 'file.wasm' };
  expect(() => new CircuitConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig3, zkeyFile: ['file.zkey', 'file.zkey.2'] };
  expect(() => new CircuitConfig(rawConfig4)).toThrow();
  const rawConfig5 = { ...rawConfig4, vkeyFile: 'file.vkey.json' };
  const config1 = new CircuitConfig(rawConfig5);
  expect(config1.name).toBe('circom-1.0');
  expect(config1.wasmFile).toStrictEqual(['file.wasm']);
  expect(config1.zkeyFile).toStrictEqual(['file.zkey', 'file.zkey.2']);
  expect(config1.vkeyFile).toStrictEqual(['file.vkey.json']);
  const rawConfig6 = { ...rawConfig5, vkeyFile: ['file.vkey.json'] };
  const config2 = new CircuitConfig(rawConfig6);
  expect(config2.vkeyFile).toStrictEqual(['file.vkey.json']);
  const rawConfig7 = { ...rawConfig6, wasmFile: ['file.wasm.gz', 'file.wasm'] };
  const config3 = new CircuitConfig(rawConfig7);
  expect(config3.wasmFile).toStrictEqual(['file.wasm.gz', 'file.wasm']);
});
