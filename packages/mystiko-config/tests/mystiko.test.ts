import { BridgeType, readFromFile } from '../src';

test('test getContractConfig', async () => {
  const conf = await readFromFile('tests/files/config.test.json');
  expect(() => conf.getContractConfig(1, 1, 'USDT', BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 56, 'USDT', BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(200, 200, 'USDT', BridgeType.LOOP)).toThrow();
  expect(() => conf.getContractConfig(1, 188, 'USDT', BridgeType.POLY)).toThrow();
  expect(() => conf.getContractConfig(1, 1, 'MTT', BridgeType.LOOP)).toThrow();
  const contractConf1 = conf.getContractConfig(1, 56, 'USDT', BridgeType.POLY);
  expect(contractConf1.address).toBe('0x8fb1df17768e29c936edfbce1207ad13696268b7');
  const contractConf2 = conf.getContractConfig(1, 1, 'ETH', BridgeType.LOOP);
  expect(contractConf2.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  const contractConf3 = conf.getContractConfig(1, 1, 'USDC', BridgeType.LOOP);
  expect(contractConf3.address).toBe('0x2856cf9905d923469bb749e9787fc953b0a321e8');
});

test('test readFromFile', async () => {
  const conf = await readFromFile('tests/files/config.test.json');
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
  expect(conf.getAssetSymbols(1, 1).sort()).toEqual(['ETH', 'USDC', 'USDT'].sort());
  expect(conf.getAssetSymbols(1, 56).sort()).toEqual(['USDT'].sort());
  expect(conf.getAssetSymbols(1, 100)).toEqual([]);
  expect(conf.getAssetSymbols(100, 56)).toEqual([]);
  expect(conf.getBridges(1, 1, 'USDT')).toEqual([]);
  expect(conf.getBridges(1, 1, 'USDC')).toEqual([]);
  expect(conf.getBridges(1, 56, 'USDT').map((b) => b.type)).toEqual([BridgeType.POLY]);
  expect(conf.getBridges(1, 56, 'ETH')).toEqual([]);
  expect(conf.getChainConfig(100)).toBe(undefined);
  expect(conf.getChainConfig(1)?.name).toBe('Ethereum Mainnet');
  expect(conf.getChainConfig(Number(56))?.name).toBe('BSC Mainnet');
  expect(conf.getBridgeConfig(BridgeType.LOOP)).toBe(undefined);
  expect(conf.getBridgeConfig(BridgeType.POLY)?.type).toBe(BridgeType.POLY);
  expect(conf.circuits.length).toBe(1);
  expect(conf.circuits.map((c) => c.name)).toStrictEqual(['circom-1.0']);
  expect(conf.getCircuitConfig('circom-1.0')).not.toBe(undefined);
  expect(conf.getCircuitConfig('circom-1000.0')).toBe(undefined);
  await expect(readFromFile('tests/files/configInvalid0.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid1.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid2.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid3.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid4.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid5.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid6.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid7.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid8.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid9.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid10.test.json')).rejects.toThrow();
  await expect(readFromFile('tests/files/configInvalid11.test.json')).rejects.toThrow();
});

test('test explorer url getters', async () => {
  const conf = await readFromFile('tests/files/config.test.json');
  expect(
    conf.getChainTxExplorerUrl(1, '0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac'),
  ).toBe('https://etherscan.io/tx/0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac');
  expect(
    conf.getChainTxExplorerUrl(100, '0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac'),
  ).toBe(undefined);
  expect(conf.getChainTxExplorerUrl(1, '')).toBe(undefined);
  expect(
    conf.getBridgeTxExplorerUrl(
      BridgeType.LOOP,
      '0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac',
    ),
  ).toBe(undefined);
  expect(conf.getBridgeTxExplorerUrl(BridgeType.POLY, '')).toBe(undefined);
  expect(
    conf.getBridgeTxExplorerUrl(
      BridgeType.TBRIDGE,
      '0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac',
    ),
  ).toBe(undefined);
  expect(
    conf.getBridgeTxExplorerUrl(
      BridgeType.POLY,
      '0x1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac',
    ),
  ).toBe(
    'https://explorer.poly.network/testnet/tx/' +
      '1a52467a271ab51d0b913a8d6684f245e9cf5fc9a033b532aed6c46a79841fac',
  );
});
