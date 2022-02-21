import { BaseBridgeConfig, PolyBridgeConfig } from '../../src/config/bridgeConfig.js';
import { BridgeType } from '../../src/model';

test('test BaseBridgeConfig', () => {
  const rawConfig = {};
  expect(() => new BaseBridgeConfig(rawConfig)).toThrow();
  rawConfig['name'] = 'Some Bridge Testnet';
  expect(() => new BaseBridgeConfig(rawConfig)).toThrow();
  rawConfig['type'] = 'wrong type';
  expect(() => new BaseBridgeConfig(rawConfig)).toThrow();
  rawConfig['type'] = BridgeType.POLY;
  const conf = new BaseBridgeConfig(rawConfig);
  expect(conf.name).toBe('Some Bridge Testnet');
  expect(conf.type).toBe(BridgeType.POLY);
});

test('test PolyBridgeConfig', () => {
  const rawConfig = {};
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['name'] = 'Some Bridge Testnet';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['type'] = 'wrong type';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['type'] = BridgeType.POLY;
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['explorerUrl'] = 'https://explorer.poly.network';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['explorerPrefix'] = '/testnet/tx/%wrong%';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['explorerPrefix'] = '/testnet/tx/%tx%';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['apiUrl'] = 'https://explorer.poly.network';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['apiPrefix'] = '/testnet/api/v1/getcrosstx?txhash=%wrong%';
  expect(() => new PolyBridgeConfig(rawConfig)).toThrow();
  rawConfig['apiPrefix'] = '/testnet/api/v1/getcrosstx?txhash=%tx%';
  const conf = new PolyBridgeConfig(rawConfig);
  expect(conf.name).toBe('Some Bridge Testnet');
  expect(conf.type).toBe(BridgeType.POLY);
  expect(conf.explorerUrl).toBe('https://explorer.poly.network');
  expect(conf.explorerPrefix).toBe('/testnet/tx/%tx%');
  expect(conf.apiUrl).toBe('https://explorer.poly.network');
  expect(conf.apiPrefix).toBe('/testnet/api/v1/getcrosstx?txhash=%tx%');
  expect(conf.getTxUrl('0xa0a9983ac6c6864435f851a0cec269dd08a4ea1749c2cdb5665f552ed2b17cd7')).toBe(
    'https://explorer.poly.network/testnet/tx/a0a9983ac6c6864435f851a0cec269dd08a4ea1749c2cdb5665f552ed2b17cd7',
  );
  expect(conf.getFullApiUrl('0xa0a9983ac6c6864435f851a0cec269dd08a4ea1749c2cdb5665f552ed2b17cd7')).toBe(
    'https://explorer.poly.network/testnet/api/v1/getcrosstx?txhash=a0a9983ac6c6864435f851a0cec269dd08a4ea1749c2cdb5665f552ed2b17cd7',
  );
});

test('test createConfig', () => {
  const rawConfig = {
    name: 'Some Bridge Testnet',
    type: 'wrong type',
    explorerUrl: 'https://explorer.poly.network',
    explorerPrefix: '/testnet/tx/%tx%',
    apiUrl: 'https://explorer.poly.network',
    apiPrefix: '/testnet/api/v1/getcrosstx?txhash=%tx%',
  };
  expect(() => BaseBridgeConfig.createConfig(rawConfig)).toThrow();
  rawConfig['type'] = BridgeType.POLY;
  expect(BaseBridgeConfig.createConfig(rawConfig) instanceof PolyBridgeConfig).toBe(true);

  rawConfig['type'] = BridgeType.TBRIDGE;
  expect(BaseBridgeConfig.createConfig(rawConfig) instanceof BaseBridgeConfig).toBe(true);

  rawConfig['type'] = BridgeType.CELER;
  expect(BaseBridgeConfig.createConfig(rawConfig) instanceof BaseBridgeConfig).toBe(true);
});
