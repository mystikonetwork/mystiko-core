import config from '../../src/config/index.js';

test('test readFromFile', async () => {
  const conf = await config.readFromFile('tests/config/files/config.test.json');
  expect(conf.chainIds.sort()).toEqual([1, 56].sort());
  expect(conf.getChainConfig(100)).toBe(undefined);
  expect(conf.getChainConfig(1).name).toBe('Ethereum Mainnet');
  expect(conf.getChainConfig(Number(56)).name).toBe('BSC Mainnet');
  await expect(config.readFromFile('tests/config/files/configInvalid0.test.json')).rejects.toThrow();
  await expect(config.readFromFile('tests/config/files/configInvalid1.test.json')).rejects.toThrow();
  await expect(config.readFromFile('tests/config/files/configInvalid2.test.json')).rejects.toThrow();
  await expect(config.readFromFile('tests/config/files/configInvalid3.test.json')).rejects.toThrow();
  await expect(config.readFromFile('tests/config/files/configInvalid4.test.json')).rejects.toThrow();
  await expect(config.readFromFile('tests/config/files/configInvalid5.test.json')).rejects.toThrow();
});

test('test getContractConfig', async () => {
  const conf = await config.readFromFile('tests/config/files/config.test.json');
  expect(() => conf.getContractConfig('1', 56, 'USDT', config.BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, '56', 'USDT', config.BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 1234, config.BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 'USDT', 'wrong bridge')).toThrow();
  expect(() => conf.getContractConfig(1, 1, 'USDT', config.BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 'USDT', config.BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(200, 200, 'USDT', config.BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(1, 188, 'USDT', config.BridgeType.POLY)).toThrow();
  const contractConf1 = conf.getContractConfig(1, 56, 'USDT', config.BridgeType.POLY);
  expect(contractConf1.address).toBe('0x8fb1df17768e29c936edfbce1207ad13696268b7');
  const contractConf2 = conf.getContractConfig(1, 1, 'ETH', config.BridgeType.LOOP);
  expect(contractConf2.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
});
