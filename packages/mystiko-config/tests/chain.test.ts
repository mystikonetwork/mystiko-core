import { ContractConfig, ChainConfig, EXPLORER_DEFAULT_PREFIX, EXPLORER_TX_PLACEHOLDER } from '../src';

const contractConfigs = [
  {
    version: 1,
    name: 'MystikoWithLoopMain',
    address: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithLoopERC20',
    address: '0x98ed94360cad67a76a53d8aa15905e52485b73d1',
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithPolyMain',
    address: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
    assetSymbol: 'BNB',
    assetDecimals: 18,
    peerChainId: 10,
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithPolyERC20',
    address: '0x8fb1df17768e29c936edfbce1207ad13696268b7',
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
    peerChainId: 10,
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithPolyERC20',
    address: '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
    peerChainId: 20,
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithPolyMain',
    address: '0x110a13fc3efe6a245b50102d2d79b3e76125ae83',
    assetSymbol: 'BNB',
    assetDecimals: 18,
    peerChainId: 20,
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    circuits: 'circom-1.0',
  },
  {
    version: 1,
    name: 'MystikoWithPolyMain',
    address: '0xc83cc3d27fbe6dc046bb109eadba117e3da06c56',
    assetSymbol: 'BNB',
    assetDecimals: 18,
    peerChainId: 30,
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    circuits: 'circom-1.0',
    depositDisabled: true,
  },
];

test('test ChainConfig constructor', () => {
  const rawConfig1 = {};
  expect(() => new ChainConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, chainId: 123 };
  expect(() => new ChainConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig2, name: 'Binance Smart Chain' };
  expect(() => new ChainConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig3, assetSymbol: 'BNB' };
  expect(() => new ChainConfig(rawConfig4)).toThrow();
  const rawConfig5 = { ...rawConfig4, explorerUrl: 'https://testnet.bscscan.com' };
  expect(() => new ChainConfig(rawConfig5)).toThrow();
  const rawConfig6 = { ...rawConfig5, providers: [] };
  expect(() => new ChainConfig(rawConfig6)).toThrow();
  const rawConfig7 = { ...rawConfig5, providers: ['http://127.0.0.1:7545'] };
  expect(() => new ChainConfig(rawConfig7)).toThrow();
  const rawConfig8 = { ...rawConfig7, signerEndpoint: 'http://127.0.0.1:7545' };
  expect(() => new ChainConfig(rawConfig7)).toThrow();
  const rawConfig9 = { ...rawConfig8, contracts: contractConfigs };
  const config = new ChainConfig(rawConfig9);
  expect(config.chainId).toBe(123);
  expect(config.name).toBe('Binance Smart Chain');
  expect(config.assetSymbol).toBe('BNB');
  expect(config.assetDecimals).toBe(18);
  const rawConfig10 = { ...rawConfig9, assetDecimals: 17 };
  expect(new ChainConfig(rawConfig10).assetDecimals).toBe(17);
  expect(config.explorerUrl).toBe('https://testnet.bscscan.com');
  expect(config.explorerPrefix).toBe(EXPLORER_DEFAULT_PREFIX);
  expect(config.getTxUrl('a7109a6824734d49c34e9848028e9309911ea31d69651cea7a6f002f8c8b1a69')).toBe(
    'https://testnet.bscscan.com/tx/0xa7109a6824734d49c34e9848028e9309911ea31d69651cea7a6f002f8c8b1a69',
  );
  const newPrefix = `/testnet/tx/${EXPLORER_TX_PLACEHOLDER}`;
  const rawConfig11 = { ...rawConfig10, explorerPrefix: newPrefix };
  expect(new ChainConfig(rawConfig11).explorerPrefix).toBe(newPrefix);
  const rawConfig12 = { ...rawConfig11, explorerPrefix: 'wrong string' };
  expect(() => new ChainConfig(rawConfig12)).toThrow();
  expect(config.providers.length).toBe(1);
  expect(config.providers[0]).toBe('http://127.0.0.1:7545');
  expect(config.signerEndpoint).toBe('http://127.0.0.1:7545');
  expect(config.contracts.length).toBe(7);
  expect(config.contracts[0].toString()).toBe(new ContractConfig(contractConfigs[0]).toString());
  expect(config.contracts[1].toString()).toBe(new ContractConfig(contractConfigs[1]).toString());
  expect(config.contracts[2].toString()).toBe(new ContractConfig(contractConfigs[2]).toString());
  expect(config.contracts[3].toString()).toBe(new ContractConfig(contractConfigs[3]).toString());
  expect(config.contracts[4].toString()).toBe(new ContractConfig(contractConfigs[4]).toString());
  expect(config.contracts[5].toString()).toBe(new ContractConfig(contractConfigs[5]).toString());
  expect(config.contracts[6].toString()).toBe(new ContractConfig(contractConfigs[6]).toString());
  expect(config.contractAddresses.length).toBe(7);
  expect(config.peerChainIds.sort()).toEqual([10, 20, 123, 30].sort());
  expect(config.getAssetSymbols(1000)).toEqual([]);
  expect(config.getAssetSymbols(10).sort()).toEqual(['BNB', 'USDT'].sort());
  expect(config.getAssetSymbols(20).sort()).toEqual(['BNB', 'USDT'].sort());
  expect(config.getAssetSymbols(123).sort()).toEqual(['ETH', 'USDT'].sort());
  expect(config.getAssetSymbols(30).sort()).toEqual(['BNB']);
  expect(config.getAssetSymbols(30, (conf) => !!conf && !conf.depositDisabled)).toEqual([]);
  expect(() => config.getContract('0xdeadbeef')).toThrow();
  expect(config.getContract('0x243752cf8a2612373aef8d17b8c474214ba3ce24')).toBe(undefined);
  expect(config.getContract('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879')?.toString()).toBe(
    new ContractConfig(contractConfigs[0]).toString(),
  );
  expect(config.getContract('0x98ed94360cad67a76a53d8aa15905e52485b73d1')?.toString()).toBe(
    new ContractConfig(contractConfigs[1]).toString(),
  );
  expect(config.getContract('0x26fc224b37952bd12c792425f242e0b0a55453a6')?.toString()).toBe(
    new ContractConfig(contractConfigs[2]).toString(),
  );
  expect(config.getContract('0x8fb1df17768e29c936edfbce1207ad13696268b7')?.toString()).toBe(
    new ContractConfig(contractConfigs[3]).toString(),
  );
  expect(config.getContract('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67')?.toString()).toBe(
    new ContractConfig(contractConfigs[4]).toString(),
  );
  expect(config.getContract('0x110a13fc3efe6a245b50102d2d79b3e76125ae83')?.toString()).toBe(
    new ContractConfig(contractConfigs[5]).toString(),
  );
  expect(config.syncSize).toBe(100000);
  const rawConfig13 = { ...rawConfig9, syncSize: 1000 };
  const config1 = new ChainConfig(rawConfig13);
  expect(config1.syncSize).toBe(1000);
});
