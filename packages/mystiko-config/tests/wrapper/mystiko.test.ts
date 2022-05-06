import {
  BridgeType,
  CircuitType,
  MystikoConfig,
  RawChainConfig,
  RawCircuitConfig,
  RawConfig,
  RawMystikoConfig,
  RawTBridgeConfig,
} from '../../src';

let rawConfig: RawMystikoConfig;
let config: MystikoConfig;

beforeEach(async () => {
  rawConfig = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid01.json');
  config = await MystikoConfig.createFromRaw(rawConfig);
});

test('test equality', () => {
  expect(config.version).toBe(rawConfig.version);
  expect(config.chains.map((conf) => conf.copyData()).sort()).toStrictEqual(rawConfig.chains.sort());
  expect(config.circuits.map((conf) => conf.copyData()).sort()).toStrictEqual(rawConfig.circuits.sort());
  expect(config.bridges.map((conf) => conf.copyData()).sort()).toStrictEqual(rawConfig.bridges.sort());
});

test('test getChainConfig', () => {
  expect(config.getChainConfig(3)?.copyData()).toStrictEqual(rawConfig.chains[0]);
  expect(config.getChainConfig(97)?.copyData()).toStrictEqual(rawConfig.chains[1]);
  expect(config.getChainConfig(1024)).toBe(undefined);
});

test('test getPeerChainConfigs', () => {
  expect(
    config
      .getPeerChainConfigs(3)
      .map((conf) => conf.chainId)
      .sort(),
  ).toStrictEqual([3, 97]);
  expect(config.getPeerChainConfigs(97).map((conf) => conf.chainId)).toStrictEqual([3]);
  expect(config.getPeerChainConfigs(1024)).toStrictEqual([]);
});

test('test getAssetSymbols', () => {
  expect(config.getAssetSymbols(3, 97)).toStrictEqual(['MTT']);
  expect(config.getAssetSymbols(3, 3)).toStrictEqual(['ETH']);
  expect(config.getAssetSymbols(97, 3)).toStrictEqual(['MTT']);
  expect(config.getAssetSymbols(97, 97)).toStrictEqual([]);
  expect(config.getAssetSymbols(3, 1024)).toStrictEqual([]);
  expect(config.getAssetSymbols(1024, 97)).toStrictEqual([]);
});

test('test getBridges', () => {
  expect(
    config
      .getBridges(3, 97, 'MTT')
      .map((conf) => conf.type)
      .sort(),
  ).toStrictEqual([BridgeType.CELER, BridgeType.TBRIDGE]);
  expect(
    config
      .getBridges(97, 3, 'MTT')
      .map((conf) => conf.type)
      .sort(),
  ).toStrictEqual([BridgeType.CELER, BridgeType.TBRIDGE]);
  expect(config.getBridges(1024, 97, 'MTT')).toStrictEqual([]);
  expect(config.getBridges(3, 1024, 'MTT')).toStrictEqual([]);
  expect(config.getBridges(3, 97, 'ETH')).toStrictEqual([]);
});

test('test getDepositContractConfig', () => {
  expect(config.getDepositContractConfig(3, 97, 'MTT', BridgeType.CELER)).toStrictEqual(
    config.getDepositContractConfigByAddress(3, '0xe6394a06905d83B19Dbd51804Ca84677a2054FA6'),
  );
  expect(config.getDepositContractConfig(3, 97, 'MTT', BridgeType.TBRIDGE)).toStrictEqual(
    config.getDepositContractConfigByAddress(3, '0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f'),
  );
  expect(config.getDepositContractConfig(3, 3, 'ETH', BridgeType.LOOP)).toStrictEqual(
    config.getDepositContractConfigByAddress(3, '0x390d485f4d43212d4ae8cdd967a711514ed5a54f'),
  );
  expect(config.getDepositContractConfig(97, 3, 'MTT', BridgeType.CELER)).toStrictEqual(
    config.getDepositContractConfigByAddress(97, '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
  );
  expect(config.getDepositContractConfig(97, 3, 'MTT', BridgeType.TBRIDGE)).toStrictEqual(
    config.getDepositContractConfigByAddress(97, '0x9C33eaCc2F50E39940D3AfaF2c7B8246B681A374'),
  );
  expect(config.getDepositContractConfig(1024, 3, 'MTT', BridgeType.TBRIDGE)).toBe(undefined);
  expect(config.getDepositContractConfigByAddress(1024, '0x9C33eaCc2F50E39940D3AfaF2c7B8246B681A374')).toBe(
    undefined,
  );
  expect(config.getDepositContractConfigByAddress(3, '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67')).not.toBe(
    undefined,
  );
  expect(config.getDepositContractConfigByAddress(97, '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9')).not.toBe(
    undefined,
  );
  const depositContractConfig = config.getDepositContractConfigByAddress(
    3,
    '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
  );
  expect(depositContractConfig?.peerContract).toStrictEqual(
    config.getDepositContractConfigByAddress(97, '0xd791049D0a154bC7860804e1A18ACD148Eb0afD9'),
  );
});

test('test getPoolContractConfig', () => {
  expect(config.getPoolContractConfig(3, 'MTT', BridgeType.CELER)).toStrictEqual(
    config.getPoolContractConfigByAddress(3, '0x20Eb345870059E688c59e89523442ade33C7c813'),
  );
  expect(config.getPoolContractConfig(3, 'MTT', BridgeType.TBRIDGE)).toStrictEqual(
    config.getPoolContractConfigByAddress(3, '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d'),
  );
  expect(config.getPoolContractConfig(3, 'ETH', BridgeType.LOOP)).toStrictEqual(
    config.getPoolContractConfigByAddress(3, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  );
  expect(config.getPoolContractConfig(97, 'MTT', BridgeType.CELER)).toStrictEqual(
    config.getPoolContractConfigByAddress(97, '0x6B8a4ea37C72F1992626eb9bD48d4aA6aa077c47'),
  );
  expect(config.getPoolContractConfig(97, 'MTT', BridgeType.TBRIDGE)).toStrictEqual(
    config.getPoolContractConfigByAddress(97, '0xBe2C9c8a00951662dF3a978b25F448968F0595AE'),
  );
  expect(config.getPoolContractConfig(1024, 'MTT', BridgeType.CELER)).toBe(undefined);
  expect(config.getPoolContractConfigByAddress(1024, '0xBe2C9c8a00951662dF3a978b25F448968F0595AE')).toBe(
    undefined,
  );
});

test('test getBridgeConfig', () => {
  expect(config.getBridgeConfig(BridgeType.POLY)?.copyData()).toStrictEqual(rawConfig.bridges[0]);
  expect(config.getBridgeConfig(BridgeType.TBRIDGE)?.copyData()).toStrictEqual(rawConfig.bridges[1]);
  expect(config.getBridgeConfig(BridgeType.CELER)?.copyData()).toStrictEqual(rawConfig.bridges[2]);
});

test('test getDefaultCircuitConfig', () => {
  expect(config.getDefaultCircuitConfig(CircuitType.ROLLUP1)?.name).toBe('zokrates-1.0-rollup1');
});

test('test getCircuitConfigByName', () => {
  expect(config.getCircuitConfigByName('zokrates-2.0-rollup1')?.isDefault).toBe(false);
  expect(config.getCircuitConfigByName('zokrates-4.0-rollup1')).toBe(undefined);
});

test('test createFromFile', async () => {
  const newConfig = await MystikoConfig.createFromFile('tests/files/mystiko.valid01.json');
  expect(newConfig.toJsonString()).toBe(config.toJsonString());
});

test('test duplicate circuit type default', async () => {
  rawConfig.circuits.push(
    await RawConfig.createFromObject(RawCircuitConfig, {
      name: 'zokrates-2.0-transaction2x2',
      type: CircuitType.TRANSACTION2x2,
      isDefault: true,
      programFile: ['./Transaction2x2.program.gz'],
      abiFile: ['./Transaction2x2.abi.json'],
      provingKeyFile: ['./Transaction2x2.pkey.gz'],
      verifyingKeyFile: ['./Transaction2x2.vkey.gz'],
    }),
  );
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(`duplicate default circuit type=${CircuitType.TRANSACTION2x2} definition`),
  );
});

test('test duplicate circuit name', async () => {
  rawConfig.circuits.push(
    await RawConfig.createFromObject(RawCircuitConfig, {
      name: 'zokrates-1.0-transaction2x2',
      type: CircuitType.TRANSACTION2x2,
      isDefault: false,
      programFile: ['./Transaction2x2.program.gz'],
      abiFile: ['./Transaction2x2.abi.json'],
      provingKeyFile: ['./Transaction2x2.pkey.gz'],
      verifyingKeyFile: ['./Transaction2x2.vkey.gz'],
    }),
  );
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow();
});

test('test missing default circuit', async () => {
  rawConfig.circuits = rawConfig.circuits.slice(1);
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(`missing definition of default circuit type=${CircuitType.ROLLUP1}`),
  );
});

test('test duplicate bridge type', async () => {
  rawConfig.bridges.push(
    await RawConfig.createFromObject(RawTBridgeConfig, {
      name: 'TBridge #2',
    }),
  );
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow();
});

test('test missing bridge definition', async () => {
  rawConfig.bridges = rawConfig.bridges.filter((raw) => raw.type !== BridgeType.CELER);
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(`bridge type=${BridgeType.CELER} definition does not exist`),
  );
});

test('test duplicate chain config', async () => {
  rawConfig.chains.push(
    await RawConfig.createFromObject(RawChainConfig, {
      chainId: 3,
      name: 'Ethereum Ropsten',
      assetSymbol: 'ETH',
      assetDecimals: 18,
      explorerUrl: 'https://ropsten.etherscan.io',
      explorerPrefix: '/tx/%tx%',
      providers: [
        {
          url: 'http://localhost:8545',
        },
      ],
      signerEndpoint: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      depositContracts: [],
      poolContracts: [],
    }),
  );
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow();
});

test('test invalid peerChainId', async () => {
  rawConfig.chains[0].depositContracts[1].peerChainId = 1024;
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(
      'no corresponding peer chain id=1024 definition for deposit contract ' +
        '0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f peer chain configuration',
    ),
  );
});

test('test invalid peerChainAddress', async () => {
  rawConfig.chains[0].depositContracts[1].peerContractAddress = '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6';
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(
      'no corresponding peer deposit contract chain id=97 and ' +
        'address=0x5c7c88e07e3899fff3cc0effe23494591dfe87b6 definition ' +
        'for deposit contract address=0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f ' +
        'peer chain configuration',
    ),
  );
});

test('test bridgeType mismatch', async () => {
  rawConfig.chains[0].depositContracts[2].bridgeType = BridgeType.POLY;
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(
      'bridge type mismatch for chain id=97 address=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ' +
        'vs chain id=3 and address=0xe6394a06905d83B19Dbd51804Ca84677a2054FA6',
    ),
  );
});

test('test peerChainId mismatch', async () => {
  rawConfig.chains[1].depositContracts[1].peerChainId = 1024;
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(
      'chain id=1024 and address=0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f does not match ' +
        'chain id=3 and address=0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f configured',
    ),
  );
});

test('test peerContractAddress mismatch', async () => {
  rawConfig.chains[1].depositContracts[1].peerContractAddress = '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6';
  await expect(MystikoConfig.createFromRaw(rawConfig)).rejects.toThrow(
    new Error(
      'chain id=3 and address=0x5c7c88e07e3899fff3cc0effe23494591dfe87b6 does not match ' +
        'chain id=3 and address=0xbF5605f5Ed6d18ed957cBA80dbA8838dFcb9A69f configured',
    ),
  );
});

test('test createDefaultTestnetConfig', async () => {
  await MystikoConfig.createDefaultTestnetConfig();
});

test('test createDefaultMainnetConfig', async () => {
  await MystikoConfig.createDefaultMainnetConfig();
});

test('test getTransactionUrl', () => {
  expect(
    config.getTransactionUrl(1024, '0xbce8d733536ee3b769456cf91bebae1e9e5be6cb89bb7490c6225384e1bc5e3e'),
  ).toBe(undefined);
  expect(
    config.getTransactionUrl(3, '0xbce8d733536ee3b769456cf91bebae1e9e5be6cb89bb7490c6225384e1bc5e3e'),
  ).toBe(
    'https://ropsten.etherscan.io/tx/0xbce8d733536ee3b769456cf91bebae1e9e5be6cb89bb7490c6225384e1bc5e3e',
  );
});

test('test mutate', () => {
  expect(config.mutate().copyData()).toStrictEqual(rawConfig);
  rawConfig.version = '1.1.1';
  const newConfig = config.mutate(rawConfig);
  expect(newConfig.version).toBe('1.1.1');
});
