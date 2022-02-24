import { BaseBridgeConfig, BridgeType, createBridgeConfig, PolyBridgeConfig } from '../src';

test('test BaseBridgeConfig', () => {
  const rawConfig1 = {};
  expect(() => new BaseBridgeConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, name: 'Some Bridge Testnet' };
  expect(() => new BaseBridgeConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig2, type: 'wrong type' };
  expect(() => new BaseBridgeConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig2, type: BridgeType.POLY };
  const conf = new BaseBridgeConfig(rawConfig4);
  expect(conf.name).toBe('Some Bridge Testnet');
  expect(conf.type).toBe(BridgeType.POLY);
});

test('test PolyBridgeConfig', () => {
  const rawConfig1 = {};
  expect(() => new PolyBridgeConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, name: 'Some Bridge Testnet' };
  expect(() => new PolyBridgeConfig(rawConfig2)).toThrow();
  const rawConfig3 = { ...rawConfig2, type: 'wrong type' };
  expect(() => new PolyBridgeConfig(rawConfig3)).toThrow();
  const rawConfig4 = { ...rawConfig2, type: BridgeType.POLY };
  expect(() => new PolyBridgeConfig(rawConfig4)).toThrow();
  const rawConfig5 = { ...rawConfig4, explorerUrl: 'https://explorer.poly.network' };
  expect(() => new PolyBridgeConfig(rawConfig5)).toThrow();
  const rawConfig6 = { ...rawConfig5, explorerPrefix: '/testnet/tx/%wrong%' };
  expect(() => new PolyBridgeConfig(rawConfig6)).toThrow();
  const rawConfig7 = { ...rawConfig5, explorerPrefix: '/testnet/tx/%tx%' };
  expect(() => new PolyBridgeConfig(rawConfig7)).toThrow();
  const rawConfig8 = { ...rawConfig7, apiUrl: 'https://explorer.poly.network' };
  expect(() => new PolyBridgeConfig(rawConfig8)).toThrow();
  const rawConfig9 = { ...rawConfig8, apiPrefix: '/testnet/api/v1/getcrosstx?txhash=%wrong%' };
  expect(() => new PolyBridgeConfig(rawConfig9)).toThrow();
  const rawConfig10 = { ...rawConfig8, apiPrefix: '/testnet/api/v1/getcrosstx?txhash=%tx%' };
  const conf = new PolyBridgeConfig(rawConfig10);
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
  const rawConfig1 = {
    name: 'Some Bridge Testnet',
    type: 'wrong type',
    explorerUrl: 'https://explorer.poly.network',
    explorerPrefix: '/testnet/tx/%tx%',
    apiUrl: 'https://explorer.poly.network',
    apiPrefix: '/testnet/api/v1/getcrosstx?txhash=%tx%',
  };
  expect(() => createBridgeConfig(rawConfig1)).toThrow();
  const rawConfig2 = { ...rawConfig1, type: BridgeType.POLY };
  expect(createBridgeConfig(rawConfig2) instanceof PolyBridgeConfig).toBe(true);

  const rawConfig3 = { ...rawConfig1, type: BridgeType.TBRIDGE };
  expect(createBridgeConfig(rawConfig3) instanceof BaseBridgeConfig).toBe(true);

  const rawConfig4 = { ...rawConfig1, type: BridgeType.CELER };
  expect(createBridgeConfig(rawConfig4) instanceof BaseBridgeConfig).toBe(true);
});
