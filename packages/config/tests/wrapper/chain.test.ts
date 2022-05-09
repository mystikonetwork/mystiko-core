import { toBN } from '@mystikonetwork/utils';
import {
  AssetType,
  BridgeType,
  ChainConfig,
  CircuitConfig,
  CircuitType,
  ProviderConfig,
  RawChainConfig,
  RawConfig,
  RawDepositContractConfig,
  RawMystikoConfig,
  RawPoolContractConfig,
} from '../../src';

let rawConfig: RawChainConfig;
let config: ChainConfig;
let rawMystikoConfig: RawMystikoConfig;
let defaultCircuitConfigs: Map<CircuitType, CircuitConfig>;
let circuitConfigsByName: Map<string, CircuitConfig>;

beforeEach(async () => {
  rawMystikoConfig = await RawConfig.createFromFile(RawMystikoConfig, 'tests/files/mystiko.valid.json');
  circuitConfigsByName = new Map<string, CircuitConfig>();
  defaultCircuitConfigs = new Map<CircuitType, CircuitConfig>();
  rawMystikoConfig.circuits.forEach((rawCircuitConfig) => {
    const circuitConfig = new CircuitConfig(rawCircuitConfig);
    circuitConfigsByName.set(rawCircuitConfig.name, circuitConfig);
    if (rawCircuitConfig.isDefault) {
      defaultCircuitConfigs.set(rawCircuitConfig.type, circuitConfig);
    }
  });
  rawConfig = await RawConfig.createFromFile(RawChainConfig, 'tests/files/chain.valid.json');
  expect(() => new ChainConfig(rawConfig)).toThrow(new Error('auxData has not been specified'));
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
});

test('test equality', () => {
  expect(config.chainId).toBe(rawConfig.chainId);
  expect(config.name).toBe(rawConfig.name);
  expect(config.assetSymbol).toBe(rawConfig.assetSymbol);
  expect(config.assetDecimals).toBe(rawConfig.assetDecimals);
  expect(config.recommendedAmounts).toStrictEqual([
    toBN('1000000000000000000'),
    toBN('10000000000000000000'),
  ]);
  expect(config.recommendedAmountsNumber).toStrictEqual([1, 10]);
  expect(config.explorerUrl).toBe(rawConfig.explorerUrl);
  expect(config.explorerPrefix).toBe(rawConfig.explorerPrefix);
  expect(config.signerEndpoint).toBe(rawConfig.signerEndpoint);
  expect(config.eventFilterSize).toBe(rawConfig.eventFilterSize);
  expect(config.providers).toStrictEqual(rawConfig.providers.map((raw) => new ProviderConfig(raw)));
  expect(config.poolContracts.length).toBe(rawConfig.poolContracts.length);
  expect(config.poolContracts.map((conf) => conf.address).sort()).toStrictEqual(
    rawConfig.poolContracts.map((conf) => conf.address).sort(),
  );
  expect(config.depositContracts.length).toBe(0);
  expect(config.depositContractsWithDisabled.length).toBe(rawConfig.depositContracts.length);
  expect(config.depositContractsWithDisabled.map((conf) => conf.address).sort()).toStrictEqual(
    rawConfig.depositContracts.map((conf) => conf.address).sort(),
  );
  expect(config.assets.length).toBe(1);
});

test('test peerChainIds', async () => {
  expect(config.peerChainIds).toStrictEqual([]);
  rawConfig.depositContracts[0].disabled = false;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.peerChainIds).toStrictEqual([97]);
  const loopDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0x20Eb345870059E688c59e89523442ade33C7c813',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const poolContractConfig = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x20Eb345870059E688c59e89523442ade33C7c813',
    startBlock: 1000000,
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
  });
  rawConfig.depositContracts.push(loopDepositContractConfig);
  rawConfig.poolContracts.push(poolContractConfig);
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.peerChainIds.sort()).toStrictEqual([3, 97]);
});

test('test getAssetSymbols', async () => {
  expect(config.getAssetSymbols(97)).toStrictEqual([]);
  rawConfig.depositContracts[0].disabled = false;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getAssetSymbols(97)).toStrictEqual(['MTT']);
  const poolContractConfig1 = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    startBlock: 1000000,
    assetType: AssetType.MAIN,
    assetSymbol: 'ETH',
    assetDecimals: 16,
    minRollupFee: '40000000000000000',
  });
  const poolContractConfig2 = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x20Eb345870059E688c59e89523442ade33C7c813',
    startBlock: 1000000,
    assetType: AssetType.MAIN,
    assetSymbol: 'ETH',
    assetDecimals: 16,
    minRollupFee: '40000000000000000',
  });
  const loopDepositContractConfig1 = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const loopDepositContractConfig2 = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x0b1d6565d88f9bf6473e21c2ab58d28a495d7bb5',
    bridgeType: BridgeType.TBRIDGE,
    startBlock: 1000000,
    poolAddress: '0x20Eb345870059E688c59e89523442ade33C7c813',
    peerChainId: 97,
    peerContractAddress: '0x390de26d772d2e2005c6d1d24afc902bae37a4bb',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  rawConfig.depositContracts.push(loopDepositContractConfig1);
  rawConfig.depositContracts.push(loopDepositContractConfig2);
  rawConfig.poolContracts.push(poolContractConfig1);
  rawConfig.poolContracts.push(poolContractConfig2);
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getAssetSymbols(97).sort()).toStrictEqual(['ETH', 'MTT']);
  expect(config.getAssetSymbols(3)).toStrictEqual(['ETH']);
});

test('test getBridges', async () => {
  expect(config.getBridges(97, 'MTT')).toStrictEqual([]);
  rawConfig.depositContracts[0].disabled = false;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getBridges(97, 'MTT')).toStrictEqual([BridgeType.TBRIDGE]);
  const loopDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0x6b8a4ea37c72f1992626eb9bd48d4aa6aa077c47',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const poolContractConfig1 = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x6b8a4ea37c72f1992626eb9bd48d4aa6aa077c47',
    startBlock: 1000000,
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
  });
  rawConfig.depositContracts.push(loopDepositContractConfig);
  rawConfig.poolContracts.push(poolContractConfig1);
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getBridges(3, 'MTT')).toStrictEqual([]);
  const celerDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x4c55C41Bd839B3552fb2AbecaCFdF4a5D2879Cb9',
    startBlock: 1000000,
    bridgeType: BridgeType.CELER,
    poolAddress: '0x20Eb345870059E688c59e89523442ade33C7c813',
    peerChainId: 97,
    peerContractAddress: '0x390de26d772d2e2005c6d1d24afc902bae37a4bb',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const poolContractConfig2 = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x20Eb345870059E688c59e89523442ade33C7c813',
    startBlock: 1000000,
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
  });
  rawConfig.depositContracts.push(celerDepositContractConfig);
  rawConfig.poolContracts.push(poolContractConfig2);
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getBridges(97, 'MTT').sort()).toStrictEqual([BridgeType.CELER, BridgeType.TBRIDGE]);
});

test('test getDepositContract', async () => {
  expect(config.getDepositContract(97, 'MTT', BridgeType.TBRIDGE)).toBe(undefined);
  const tbridgeDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x4c55C41Bd839B3552fb2AbecaCFdF4a5D2879Cb9',
    startBlock: 1000000,
    bridgeType: BridgeType.TBRIDGE,
    poolAddress: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    peerChainId: 97,
    peerContractAddress: '0x390de26d772d2e2005c6d1d24afc902bae37a4bb',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const loopDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0x20Eb345870059E688c59e89523442ade33C7c813',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const poolContractConfig = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x20Eb345870059E688c59e89523442ade33C7c813',
    startBlock: 1000000,
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
  });
  rawConfig.depositContracts.push(tbridgeDepositContractConfig);
  rawConfig.depositContracts.push(loopDepositContractConfig);
  rawConfig.poolContracts.push(poolContractConfig);
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getDepositContract(97, 'MTT', BridgeType.TBRIDGE)?.address).toBe(
    '0x4c55C41Bd839B3552fb2AbecaCFdF4a5D2879Cb9',
  );
  expect(config.getDepositContract(3, 'MTT', BridgeType.LOOP)?.address).toBe(
    '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
  );
  expect(config.getDepositContractByAddress('0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1')?.poolAddress).toBe(
    '0x20Eb345870059E688c59e89523442ade33C7c813',
  );
  expect(config.getDepositContractByAddress('0x5380442d3c4ec4f5777f551f5edd2fa0f691a27c')).toBe(undefined);
});

test('test getPoolContract', async () => {
  const tbridgeDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x4c55C41Bd839B3552fb2AbecaCFdF4a5D2879Cb9',
    startBlock: 1000000,
    bridgeType: BridgeType.TBRIDGE,
    poolAddress: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    peerChainId: 100,
    peerContractAddress: '0x390de26d772d2e2005c6d1d24afc902bae37a4bb',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const loopDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  const poolContractConfig = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    startBlock: 1000000,
    assetType: AssetType.MAIN,
    assetSymbol: 'ETH',
    assetDecimals: 16,
    minRollupFee: '40000000000000000',
  });
  rawConfig.poolContracts.push(poolContractConfig);
  rawConfig.depositContracts.push(tbridgeDepositContractConfig);
  rawConfig.depositContracts.push(loopDepositContractConfig);
  rawConfig.depositContracts[0].disabled = false;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getPoolContract('MTT', BridgeType.TBRIDGE)?.address).toBe(
    '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
  );
  expect(config.getPoolContract('mUSD', BridgeType.TBRIDGE)?.address).toBe(undefined);
  expect(config.getPoolContract('MTT', BridgeType.LOOP)).toBe(undefined);
  expect(config.getPoolContract('ETH', BridgeType.LOOP)?.address).toBe(
    '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
  );
  expect(config.getPoolContractByAddress('0x954c6c78A2F93E6E19Ff1DE538F720311414530c')?.assetSymbol).toBe(
    'ETH',
  );
  expect(config.getPoolContractByAddress('0x5380442d3c4ec4f5777f551f5edd2fa0f691a27c')).toBe(undefined);
});

test('test getPoolContractBridgeType', () => {
  expect(config.getPoolContractBridgeType('0x721d424047d3a8dd20f7a88f2eadad16fd2fab51')).toBe(undefined);
  expect(config.getPoolContractBridgeType('0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d')).toBe(
    BridgeType.TBRIDGE,
  );
});

test('test getEventFilterSizeByAddress', () => {
  rawConfig.eventFilterSize = 12345;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.getEventFilterSizeByAddress('0x5380442d3c4ec4f5777f551f5edd2fa0f691a27c')).toBe(12345);
  expect(config.getEventFilterSizeByAddress('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67')).toBe(12345);
  expect(config.getEventFilterSizeByAddress('0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d')).toBe(12345);
  rawConfig.depositContracts[0].eventFilterSize = 87654321;
  rawConfig.poolContracts[0].eventFilterSize = 987654321;
  expect(config.getEventFilterSizeByAddress('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67')).toBe(87654321);
  expect(config.getEventFilterSizeByAddress('0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d')).toBe(987654321);
});

test('test invalid poolAddress', () => {
  rawConfig.depositContracts[0].poolAddress = '0x5380442d3c4ec4f5777f551f5edd2fa0f691a27c';
  expect(
    () =>
      new ChainConfig(rawConfig, {
        defaultCircuitConfigs,
        circuitConfigsByName,
        depositContractGetter: () => undefined,
      }),
  ).toThrow(
    new Error(
      'deposit contract=0x961f315a836542e603a3df2e0dd9d4ecd06ebc67 poolAddress definition does not exist',
    ),
  );
});

test('test invalid peerChainId', () => {
  rawConfig.depositContracts[0].peerChainId = 3;
  expect(
    () =>
      new ChainConfig(rawConfig, {
        defaultCircuitConfigs,
        circuitConfigsByName,
        depositContractGetter: () => undefined,
      }),
  ).toThrow(
    new Error(
      'current chain id should be different with peer chain id in contract=0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    ),
  );
});

test('test duplicate bridge and asset', async () => {
  const poolContractConfig = await RawConfig.createFromObject(RawPoolContractConfig, {
    version: 2,
    name: 'CommitmentPool',
    address: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    startBlock: 1000000,
    assetType: AssetType.ERC20,
    assetSymbol: 'MTT',
    assetDecimals: 16,
    assetAddress: '0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a',
    minRollupFee: '40000000000000000',
  });
  const tbridgeDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x4c55C41Bd839B3552fb2AbecaCFdF4a5D2879Cb9',
    startBlock: 1000000,
    bridgeType: BridgeType.TBRIDGE,
    poolAddress: '0x954c6c78A2F93E6E19Ff1DE538F720311414530c',
    peerChainId: 100,
    peerContractAddress: '0x390de26d772d2e2005c6d1d24afc902bae37a4bb',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  rawConfig.poolContracts.push(poolContractConfig);
  rawConfig.depositContracts.push(tbridgeDepositContractConfig);
  rawConfig.depositContracts[0].disabled = false;
  expect(
    () =>
      new ChainConfig(rawConfig, {
        defaultCircuitConfigs,
        circuitConfigsByName,
        depositContractGetter: () => undefined,
      }),
  ).toThrow(new Error(`only one pool address allowed for asset MTT and bridge type ${BridgeType.TBRIDGE}`));
});

test('test different bridge with same pool address', async () => {
  expect(config.peerChainIds).toStrictEqual([]);
  rawConfig.depositContracts[0].disabled = false;
  config = new ChainConfig(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(config.peerChainIds).toStrictEqual([97]);
  const loopDepositContractConfig = await RawConfig.createFromObject(RawDepositContractConfig, {
    version: 2,
    name: 'MystikoWithPolyERC20',
    address: '0x2f0Fe3154C281Cb25D6a615bf524230e57A462e1',
    startBlock: 1000000,
    bridgeType: BridgeType.LOOP,
    poolAddress: '0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    minAmount: '10000000000000000',
    minBridgeFee: '20000000000000000',
    minExecutorFee: '30000000000000000',
  });
  rawConfig.depositContracts.push(loopDepositContractConfig);
  expect(
    () =>
      new ChainConfig(rawConfig, {
        defaultCircuitConfigs,
        circuitConfigsByName,
        depositContractGetter: () => undefined,
      }),
  ).toThrow(
    new Error(
      'deposit contract with different bridge type ' +
        'cannot share same pool address=0xF55Dbe8D71Df9Bbf5841052C75c6Ea9eA717fc6d',
    ),
  );
});

test('test getAssetConfigByAddress', () => {
  expect(config.getAssetConfigByAddress('0xEC1d5CfB0bf18925aB722EeeBCB53Dc636834e8a')?.assetDecimals).toBe(
    16,
  );
  expect(config.getAssetConfigByAddress('0xBc28029D248FC60bce0bAC01cF41A53aEEaE06F9')).toBe(undefined);
});

test('test getTransactionUrl', () => {
  expect(config.getTransactionUrl('0xbce8d733536ee3b769456cf91bebae1e9e5be6cb89bb7490c6225384e1bc5e3e')).toBe(
    'https://ropsten.etherscan.io/tx/0xbce8d733536ee3b769456cf91bebae1e9e5be6cb89bb7490c6225384e1bc5e3e',
  );
});

test('test copy', () => {
  expect(config.copyData()).toStrictEqual(rawConfig);
});

test('test mutate', () => {
  expect(config.mutate().copyData()).toStrictEqual(rawConfig);
  rawConfig.name = 'another name';
  let newConfig = config.mutate(rawConfig);
  expect(newConfig.name).toBe('another name');
  newConfig = config.mutate(rawConfig, {
    defaultCircuitConfigs,
    circuitConfigsByName,
    depositContractGetter: () => undefined,
  });
  expect(newConfig.copyData()).toStrictEqual(rawConfig);
});

test('test toJsonString', async () => {
  const jsonString = config.toJsonString();
  const loadedRawConfig = await RawConfig.createFromObject(RawChainConfig, JSON.parse(jsonString));
  expect(loadedRawConfig).toStrictEqual(rawConfig);
});
