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
