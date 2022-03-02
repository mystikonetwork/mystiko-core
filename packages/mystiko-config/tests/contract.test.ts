import { ContractConfig, MystikoABI, AssetType, BridgeType } from '../src';

test('test ContractConfig constructor', () => {
  const rawConfig1 = { version: 1 };
  expect(() => new ContractConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, name: 'WrongContractName' };
  expect(() => new ContractConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig1, name: 'MystikoWithLoopMain' };
  expect(() => new ContractConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig3, address: '0xdeadbeef' };
  expect(() => new ContractConfig(rawConfig4)).toThrow();
  const rawConfig5 = { ...rawConfig3, address: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' };
  expect(() => new ContractConfig(rawConfig5)).toThrow();
  const rawConfig6 = { ...rawConfig5, assetSymbol: 'ETH' };
  expect(() => new ContractConfig(rawConfig6)).toThrow();
  const rawConfig7 = { ...rawConfig6, assetDecimals: 18 };
  expect(() => new ContractConfig(rawConfig7)).toThrow();
  const rawConfig8 = { ...rawConfig7, assetAddress: '0xdeadbeef' };
  expect(() => new ContractConfig(rawConfig8)).toThrow();
  const rawConfig9 = { ...rawConfig8, assetAddress: undefined, circuits: 'circom-1.0' };
  const conf1 = new ContractConfig(rawConfig9);
  expect(conf1.version).toBe(1);
  expect(conf1.name).toBe('MystikoWithLoopMain');
  expect(conf1.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(conf1.assetSymbol).toBe('ETH');
  expect(conf1.assetDecimals).toBe(18);
  expect(conf1.assetType).toBe(AssetType.MAIN);
  expect(conf1.assetAddress).toBe(undefined);
  expect(conf1.bridgeType).toBe(BridgeType.LOOP);
  expect(conf1.abi).toBe(MystikoABI.MystikoWithLoopMain.abi);
  expect(conf1.peerChainId).toBe(undefined);
  expect(conf1.peerContractAddress).toBe(undefined);
  expect(conf1.minBridgeFee.toNumber()).toBe(0);
  expect(conf1.syncStart).toBe(0);
  expect(conf1.circuits).toBe('circom-1.0');
  const rawConfig10 = { ...rawConfig9, name: 'MystikoWithPolyERC20', peerChainId: 10 };
  expect(() => new ContractConfig(rawConfig10)).toThrow();
  const rawConfig11 = {
    ...rawConfig10,
    assetAddress: '0x7826bfec2f7811f20feeb7f294e7f561233e2a2a',
    peerContractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
  };
  const conf2 = new ContractConfig(rawConfig11);
  expect(conf2.peerChainId).toBe(10);
  expect(conf2.peerContractAddress).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(conf2.assetAddress).toBe('0x7826bfec2f7811f20feeb7f294e7f561233e2a2a');
  const rawConfig12 = { ...rawConfig11, minBridgeFee: '0x' };
  expect(() => new ContractConfig(rawConfig12)).toThrow();
  const rawConfig13 = { ...rawConfig11, minBridgeFee: '-1' };
  expect(() => new ContractConfig(rawConfig13)).toThrow();
  const rawConfig14 = { ...rawConfig11, minBridgeFee: '123' };
  const conf3 = new ContractConfig(rawConfig14);
  expect(conf3.minBridgeFee.toNumber()).toBe(123);
  const rawConfig15 = { ...rawConfig14, syncStart: -123 };
  expect(() => new ContractConfig(rawConfig15)).toThrow();
  const rawConfig16 = { ...rawConfig14, syncStart: 456 };
  const conf4 = new ContractConfig(rawConfig16);
  expect(conf4.syncStart).toBe(456);
});
