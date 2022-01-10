import {
  BridgeTokenConfig,
  LoopTokenConfig,
  BridgeConfig,
  CrossChainConfig,
  SameChainConfig,
  FileConfig,
  AbiConfig,
  WithdrawZkpConfig,
  ZkpConfig,
  MystikoConfig,
  createConfig,
} from '../src/config.js';

test('Test BridgeTokenConfig', () => {
  expect(() => new BridgeTokenConfig()).toThrow('config cannot be null');
  const testConfig = {};
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('key name cannot be null');
  testConfig['name'] = '';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('key name cannot be empty');
  testConfig['name'] = 'abc';
  testConfig['srcTokenAddress'] = 'ededddeed';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid address ededddeed');
  testConfig['srcTokenAddress'] = '0x412481ca1431988a9fa62c604bfa1af54cd11e66';
  testConfig['dstTokenAddress'] = 'adbcewfdf';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid address adbcewfdf');
  testConfig['dstTokenAddress'] = '0x3a8da27062e5c85ca271282a595cee91ff3250cd';
  testConfig['srcProtocolAddress'] = 'erfsdf';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid address erfsdf');
  testConfig['srcProtocolAddress'] = '0x26fc224b37952bd12c792425f242e0b0a55453a6';
  testConfig['dstProtocolAddress'] = '2efvgds';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid address 2efvgds');
  testConfig['dstProtocolAddress'] = '0x9c3f0fc85ef9144412388e7e952eb505e2c4a10f';
  testConfig['allowedAmounts'] = 'adc';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid array adc');
  testConfig['allowedAmounts'] = ['adc'];
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid integer adc');
  testConfig['allowedAmounts'] = [10, 100, 1000];
  testConfig['decimal'] = 'abc';
  expect(() => new BridgeTokenConfig(testConfig)).toThrow('invalid integer abc');
  testConfig['decimal'] = 18;
  const config = new BridgeTokenConfig(testConfig);
  expect(config.name).toBe('abc');
  expect(config.srcTokenAddress).toBe('0x412481ca1431988a9fa62c604bfa1af54cd11e66');
  expect(config.dstTokenAddress).toBe('0x3a8da27062e5c85ca271282a595cee91ff3250cd');
  expect(config.srcProtocolAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(config.dstProtocolAddress).toBe('0x9c3f0fc85ef9144412388e7e952eb505e2c4a10f');
  expect(config.allowedAmounts).toStrictEqual([10, 100, 1000]);
  expect(config.decimal).toBe(18);
  expect(config.toString()).not.toBe(null);
});

test('Test LoopTokenConfig', () => {
  const testConfig = {};
  expect(() => new LoopTokenConfig(testConfig)).toThrow('key name cannot be null');
  testConfig['name'] = '';
  expect(() => new LoopTokenConfig(testConfig)).toThrow('key name cannot be empty');
  testConfig['name'] = 'abc';
  testConfig['tokenAddress'] = 'ededddeed';
  expect(() => new LoopTokenConfig(testConfig)).toThrow('invalid address ededddeed');
  testConfig['tokenAddress'] = '0x412481ca1431988a9fa62c604bfa1af54cd11e66';
  testConfig['protocolAddress'] = 'erfsdf';
  expect(() => new LoopTokenConfig(testConfig)).toThrow('invalid address erfsdf');
  testConfig['protocolAddress'] = '0x26fc224b37952bd12c792425f242e0b0a55453a6';
  testConfig['allowedAmounts'] = 'adc';
  expect(() => new LoopTokenConfig(testConfig)).toThrow('invalid array adc');
  testConfig['allowedAmounts'] = ['adc'];
  expect(() => new LoopTokenConfig(testConfig)).toThrow('invalid integer adc');
  testConfig['allowedAmounts'] = [10, 100, 1000];
  testConfig['decimal'] = 'abc';
  expect(() => new LoopTokenConfig(testConfig)).toThrow('invalid integer abc');
  testConfig['decimal'] = 18;
  const config = new LoopTokenConfig(testConfig);
  expect(config.name).toBe('abc');
  expect(config.tokenAddress).toBe('0x412481ca1431988a9fa62c604bfa1af54cd11e66');
  expect(config.protocolAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(config.allowedAmounts).toStrictEqual([10, 100, 1000]);
  expect(config.decimal).toBe(18);
  expect(config.toString()).not.toBe(null);
});

test('Test BridgeConfig', () => {
  const testConfig = {};
  expect(() => new BridgeConfig(testConfig)).toThrow('key name cannot be null');
  testConfig['name'] = 'poly';
  expect(() => new BridgeConfig(testConfig)).toThrow('key tokens cannot be null');
  testConfig['tokens'] = {
    USDT: {
      name: 'USDT',
      srcTokenAddress: '0x412481ca1431988a9fa62c604bfa1af54cd11e66',
      dstTokenAddress: '0x3a8da27062e5c85ca271282a595cee91ff3250cd',
      srcProtocolAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
      dstProtocolAddress: '0x9c3f0fc85ef9144412388e7e952eb505e2c4a10f',
      allowedAmounts: [1, 10, 100],
      decimal: 18,
    },
  };
  const config = new BridgeConfig(testConfig);
  expect(Object.keys(config.tokens)).toStrictEqual(['USDT']);
  expect(config.getTokenConfig('USDT').rawConfig).toStrictEqual(testConfig['tokens']['USDT']);
  expect(config.toString()).not.toBe(null);
});

test('Test CrossChainConfig', () => {
  const testConfig = {};
  expect(() => new CrossChainConfig(testConfig)).toThrow('key srcChainId cannot be null');
  testConfig['srcChainId'] = '1de';
  expect(() => new CrossChainConfig(testConfig)).toThrow('invalid integer 1de');
  testConfig['srcChainId'] = 0;
  expect(() => new CrossChainConfig(testConfig)).toThrow('key dstChainId cannot be null');
  testConfig['dstChainId'] = '2de';
  expect(() => new CrossChainConfig(testConfig)).toThrow('invalid integer 2de');
  testConfig['dstChainId'] = 1;
  expect(() => new CrossChainConfig(testConfig)).toThrow('key bridges cannot be null');
  testConfig['bridges'] = {
    poly: {
      name: 'poly',
      tokens: {
        USDT: {
          name: 'USDT',
          srcTokenAddress: '0x412481ca1431988a9fa62c604bfa1af54cd11e66',
          dstTokenAddress: '0x3a8da27062e5c85ca271282a595cee91ff3250cd',
          srcProtocolAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
          dstProtocolAddress: '0x9c3f0fc85ef9144412388e7e952eb505e2c4a10f',
          allowedAmounts: [1, 10, 100],
          decimal: 18,
        },
      },
    },
  };
  const config = new CrossChainConfig(testConfig);
  expect(Object.keys(config.bridges)).toStrictEqual(['poly']);
  expect(config.getBridgeConfig('poly').rawConfig).toStrictEqual(testConfig['bridges']['poly']);
  expect(config.toString()).not.toBe(null);
});

test('Test SameChainConfig', () => {
  const testConfig = {};
  expect(() => new SameChainConfig(testConfig)).toThrow('key chainId cannot be null');
  testConfig['chainId'] = '1de';
  expect(() => new SameChainConfig(testConfig)).toThrow('invalid integer 1de');
  testConfig['chainId'] = 0;
  expect(() => new SameChainConfig(testConfig)).toThrow('key tokens cannot be null');
  testConfig['tokens'] = {
    USDT: {
      name: 'USDT',
      tokenAddress: '0x412481ca1431988a9fa62c604bfa1af54cd11e66',
      protocolAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
      allowedAmounts: [1, 10, 100],
      decimal: 18,
    },
  };
  const config = new SameChainConfig(testConfig);
  expect(Object.keys(config.tokens)).toStrictEqual(['USDT']);
  expect(config.getTokenConfig('USDT').rawConfig).toStrictEqual(testConfig['tokens']['USDT']);
  expect(config.toString()).not.toBe(null);
});

test('Test FileConfig', () => {
  const testConfig = {};
  expect(() => new FileConfig(testConfig)).toThrow('key path cannot be null');
  testConfig['path'] = '';
  expect(() => new FileConfig(testConfig)).toThrow('key path cannot be empty');
  testConfig['path'] = '/';
  expect(() => new FileConfig(testConfig)).toThrow('key md5sum cannot be null');
  testConfig['md5sum'] = '';
  expect(() => new FileConfig(testConfig)).toThrow('key md5sum cannot be empty');
  testConfig['md5sum'] = 'abd851994cdb71897f46a9bcbe533bcb';
  const config = new FileConfig(testConfig);
  expect(config.path).toBe('/');
  expect(config.md5sum).toBe('abd851994cdb71897f46a9bcbe533bcb');
  expect(config.toString()).not.toBe(null);
});

test('Test AbiConfig', () => {
  const testConfig = {};
  const config1 = new AbiConfig(testConfig);
  expect(config1.crossChainAbi).toBe(null);
  expect(config1.sameChainAbi).toBe(null);
  testConfig['crossChainAbi'] = {
    path: 'abc.json',
    md5sum: 'abd851994cdb71897f46a9bcbe533bcb',
  };
  testConfig['sameChainAbi'] = {
    path: 'def.json',
    md5sum: '8f6ae9f4127a917d7447244de32cc3f0',
  };
  const config2 = new AbiConfig(testConfig);
  expect(config2.crossChainAbi.rawConfig).toStrictEqual(testConfig['crossChainAbi']);
  expect(config2.sameChainAbi.rawConfig).toBe(testConfig['sameChainAbi']);
  expect(config2.toString()).not.toBe(null);
});

test('Test WithdrawZkpConfig', () => {
  const testConfig = {};
  expect(() => new WithdrawZkpConfig(testConfig)).toThrow('key wasmFile cannot be null');
  testConfig['wasmFile'] = {
    path: 'abc.wasm',
    md5sum: 'abd851994cdb71897f46a9bcbe533bcb',
  };
  expect(() => new WithdrawZkpConfig(testConfig)).toThrow('key zkeyFile cannot be null');
  testConfig['zkeyFile'] = {
    path: 'def.zkey',
    md5sum: '8f6ae9f4127a917d7447244de32cc3f0',
  };
  const config = new WithdrawZkpConfig(testConfig);
  expect(config.wasmFile.rawConfig).toStrictEqual(testConfig['wasmFile']);
  expect(config.zkeyFile.rawConfig).toBe(testConfig['zkeyFile']);
  expect(config.toString()).not.toBe(null);
});

test('Test ZkpConfig', () => {
  const testConfig = {};
  const config1 = new ZkpConfig(testConfig);
  expect(config1.withdrawZkpConfig).toBe(null);
  testConfig['withdraw'] = {
    wasmFile: {
      path: 'abc.wasm',
      md5sum: 'abd851994cdb71897f46a9bcbe533bcb',
    },
    zkeyFile: {
      path: 'def.zkey',
      md5sum: '8f6ae9f4127a917d7447244de32cc3f0',
    },
  };
  const config2 = new ZkpConfig(testConfig);
  expect(config2.withdrawZkpConfig.rawConfig).toStrictEqual(testConfig['withdraw']);
  expect(config2.toString()).not.toBe(null);
});

test('Test MystikoConfig', () => {
  const testConfig1 = {};
  const config1 = new MystikoConfig(testConfig1);
  expect(config1.abi).toBe(null);
  expect(config1.zkp).toBe(null);
  expect(config1.crossChains).toBe(null);
  expect(config1.sameChains).toBe(null);
  const testConfig2 = {
    abi: {
      crossChainAbi: {
        path: 'abc.json',
        md5sum: 'abd851994cdb71897f46a9bcbe533bcb',
      },
      sameChainAbi: {
        path: 'def.json',
        md5sum: '8f6ae9f4127a917d7447244de32cc3f0',
      },
    },
    zkp: {
      withdraw: {
        wasmFile: {
          path: 'abc.wasm',
          md5sum: 'abd851994cdb71897f46a9bcbe533bcb',
        },
        zkeyFile: {
          path: 'def.zkey',
          md5sum: '8f6ae9f4127a917d7447244de32cc3f0',
        },
      },
    },
    crossChains: {
      '1-2': {
        srcChainId: 1,
        dstChainId: 2,
        bridges: {
          poly: {
            name: 'poly',
            tokens: {
              USDT: {
                name: 'USDT',
                srcTokenAddress: '0x412481ca1431988a9fa62c604bfa1af54cd11e66',
                dstTokenAddress: '0x3a8da27062e5c85ca271282a595cee91ff3250cd',
                srcProtocolAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
                dstProtocolAddress: '0x9c3f0fc85ef9144412388e7e952eb505e2c4a10f',
                allowedAmounts: [1, 10, 100],
                decimal: 18,
              },
            },
          },
        },
      },
    },
    sameChains: {
      1: {
        chainId: 1,
        tokens: {
          USDT: {
            name: 'USDT',
            tokenAddress: '0x412481ca1431988a9fa62c604bfa1af54cd11e66',
            protocolAddress: '0x26fc224b37952bd12c792425f242e0b0a55453a6',
            allowedAmounts: [1, 10, 100],
            decimal: 18,
          },
        },
      },
    },
  };
  const config2 = new MystikoConfig(testConfig2);
  expect(config2.abi.rawConfig).toStrictEqual(testConfig2['abi']);
  expect(config2.zkp.rawConfig).toStrictEqual(testConfig2['zkp']);
  expect(Object.keys(config2.crossChains)).toStrictEqual(['1-2']);
  expect(config2.getCrossChainConfig(2, 3)).toBe(null);
  expect(config2.getCrossChainConfig(1, 2).rawConfig).toStrictEqual(testConfig2['crossChains']['1-2']);
  expect(Object.keys(config2.sameChains)).toStrictEqual(['1']);
  expect(config2.getSameChainConfig(4)).toBe(null);
  expect(config2.getSameChainConfig(1).rawConfig).toStrictEqual(testConfig2['sameChains'][1]);
  expect(config2.toString()).not.toBe(null);
});

test('Test createConfig', async () => {
  const config = await createConfig('./tests/config.test.json');
  expect(config.abi).not.toBe(null);
  expect(config.zkp).not.toBe(null);
  expect(config.crossChains).not.toBe(null);
  expect(config.sameChains).not.toBe(null);
});
