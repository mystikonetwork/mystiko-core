import { AssetType, BridgeType, ContractConfig } from '../../src/config/contractConfig.js';
import { MystikoABI } from '../../src/chain/abi.js';

test('test ContractConfig constructor', () => {
  const rawConfig = { address: '0xdeadbeef' };
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['address'] = '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetSymbol'] = 'ETH';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetDecimals'] = 18;
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetType'] = 'wrong type';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetType'] = AssetType.MAIN;
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetAddress'] = '0xdeadbeef';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['assetAddress'] = '0x7826bfec2f7811f20feeb7f294e7f561233e2a2a';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['bridgeType'] = 'wrong type';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['bridgeType'] = BridgeType.LOOP;
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['wasmFile'] = 'withdraw.wasm';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['zkeyFile'] = 'withdraw.zkey';
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['vkeyFile'] = 'withdraw.vkey.json';
  const conf1 = new ContractConfig(rawConfig);
  expect(conf1.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(conf1.assetSymbol).toBe('ETH');
  expect(conf1.assetDecimals).toBe(18);
  expect(conf1.assetType).toBe(AssetType.MAIN);
  expect(conf1.assetAddress).toBe('0x7826bfec2f7811f20feeb7f294e7f561233e2a2a');
  expect(conf1.bridgeType).toBe(BridgeType.LOOP);
  expect(conf1.abi).toBe(MystikoABI.MystikoWithLoopMain);
  expect(conf1.wasmFile).toBe('withdraw.wasm');
  expect(conf1.zkeyFile).toBe('withdraw.zkey');
  expect(conf1.vkeyFile).toBe('withdraw.vkey.json');
  expect(conf1.peerChainId).toBe(undefined);
  expect(conf1.peerContractAddress).toBe(undefined);
  rawConfig['bridgeType'] = BridgeType.POLY;
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['peerChainId'] = 10;
  expect(() => new ContractConfig(rawConfig)).toThrow();
  rawConfig['peerContractAddress'] = '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879';
  rawConfig['assetType'] = AssetType.MAIN;
  rawConfig['assetAddress'] = undefined;
  const conf2 = new ContractConfig(rawConfig);
  expect(conf2.peerChainId).toBe(10);
  expect(conf2.peerContractAddress).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(conf2.assetType).toBe(AssetType.MAIN);
  expect(conf2.assetAddress).toBe(undefined);
});
