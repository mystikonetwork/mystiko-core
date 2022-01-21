import { readFromFile } from '../../src/config/mystikoConfig.js';
import { BridgeType } from '../../src/config/contractConfig.js';

test('test getContractConfig', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  expect(() => conf.getContractConfig('1', 56, 'USDT', BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, '56', 'USDT', BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 1234, BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 'USDT', 'wrong bridge')).toThrow();
  expect(() => conf.getContractConfig(1, 1, 'USDT', BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 'USDT', BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(200, 200, 'USDT', BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(1, 188, 'USDT', BridgeType.POLY)).toThrow();
  const contractConf1 = conf.getContractConfig(1, 56, 'USDT', BridgeType.POLY);
  expect(contractConf1.address).toBe('0x8fb1df17768e29c936edfbce1207ad13696268b7');
  const contractConf2 = conf.getContractConfig(1, 1, 'ETH', BridgeType.LOOP);
  expect(contractConf2.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
});

test('test readFromFile', async () => {
  const conf = await readFromFile('tests/config/files/config.test.json');
  expect(conf.version).toEqual('1.0');
  expect(conf.chains.map((c) => c.chainId).sort()).toEqual([1, 56].sort());
  expect(conf.chains.map((c) => c.name).sort()).toEqual(['Ethereum Mainnet', 'BSC Mainnet'].sort());
  expect(conf.getPeerChains(100)).toEqual([]);
  expect(
    conf
      .getPeerChains(1)
      .map((c) => c.chainId)
      .sort(),
  ).toEqual([1, 56].sort());
  expect(conf.getAssetSymbols(1, 1).sort()).toEqual(['ETH', 'USDT'].sort());
  expect(conf.getAssetSymbols(1, 56).sort()).toEqual(['USDT'].sort());
  expect(conf.getAssetSymbols(1, 100)).toEqual([]);
  expect(conf.getAssetSymbols(100, 56)).toEqual([]);
  expect(conf.getBridges(1, 1, 'USDT')).toEqual([]);
  expect(conf.getBridges(1, 56, 'USDT').map((b) => b.type)).toEqual([BridgeType.POLY]);
  expect(conf.getBridges(1, 56, 'ETH')).toEqual([]);
  expect(conf.getChainConfig(100)).toBe(undefined);
  expect(conf.getChainConfig(1).name).toBe('Ethereum Mainnet');
  expect(conf.getChainConfig(Number(56)).name).toBe('BSC Mainnet');
  expect(conf.getBridgeConfig(BridgeType.LOOP)).toBe(undefined);
  expect(conf.getBridgeConfig(BridgeType.POLY).type).toBe(BridgeType.POLY);
  expect(conf.circuits.length).toBe(1);
  expect(conf.circuits.map((c) => c.name)).toStrictEqual(['circom-1.0']);
  expect(conf.getCircuitConfig('circom-1.0')).not.toBe(undefined);
  expect(conf.getCircuitConfig('circom-1000.0')).toBe(undefined);
  await expect(readFromFile('tests/config/files/configInvalid0.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid1.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid2.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid3.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid4.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid5.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid6.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid7.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid8.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid9.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/config/files/configInvalid10.test.json')).rejects.toThrow();
});
