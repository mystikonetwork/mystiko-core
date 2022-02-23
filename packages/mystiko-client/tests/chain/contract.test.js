import { ethers } from 'ethers';
import { ContractPool, MystikoContract } from '../../src/chain/contract.js';
import { ProviderPool } from '../../src/chain/provider.js';
import { toBN, readJsonFile } from '@mystiko/utils';
import { AssetType, BridgeType, Contract } from '../../src/model';
import { readFromFile } from '../../src/config';
import { MystikoABI } from '../../src/chain/abi.js';
import { createDatabase } from '../../src/database.js';
import { ContractHandler } from '../../src/handler/contractHandler.js';

class MockContract extends ethers.Contract {
  constructor(
    address,
    abi,
    assetType,
    bridgeType,
    assetAddress,
    assetSymbol,
    assetDecimals,
    peerChainId,
    peerContractAddress,
    providerOrSigner = undefined,
  ) {
    super(address, abi, providerOrSigner);
    this._assetType = assetType;
    this._bridgeType = bridgeType;
    this._assetAddress = assetAddress;
    this._assetSymbol = assetSymbol;
    this._assetDecimals = assetDecimals;
    this._peerChainId = peerChainId;
    this._peerContractAddress = peerContractAddress;
  }

  assetType() {
    return new Promise((resolve) => resolve(this._assetType));
  }

  bridgeType() {
    return new Promise((resolve) => resolve(this._bridgeType));
  }

  asset() {
    return new Promise((resolve) => resolve(this._assetAddress));
  }

  assetSymbol() {
    return new Promise((resolve) => resolve(this._assetSymbol));
  }

  assetDecimals() {
    return new Promise((resolve) => resolve(this._assetDecimals));
  }

  peerChainId() {
    return new Promise((resolve) => resolve(this._peerChainId));
  }

  peerContractAddress() {
    return new Promise((resolve) => resolve(this._peerContractAddress));
  }
}

class MockErc20Contract extends ethers.Contract {
  constructor(address, abi, providerOrSigner, balances) {
    super(address, abi, providerOrSigner);
    this.balances = balances;
  }

  balanceOf(address) {
    if (this.balances[address]) {
      return Promise.resolve(this.balances[address]);
    }
    return Promise.resolve(toBN(0));
  }
}

class MockProvider extends ethers.providers.Provider {
  constructor(balances) {
    super();
    this.balances = balances;
  }

  getBalance(address) {
    if (this.balances[address]) {
      return Promise.resolve(this.balances[address]);
    }
    return Promise.resolve(toBN(0));
  }
}

test('test MystikoContract constructor', async () => {
  expect(() => new MystikoContract({})).toThrow();
  const contractConfig = new Contract({
    version: 1,
    name: 'MystikoWithLoopERC20',
    address: '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1',
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress: '0xaE110b575E21949DEc823EfB81951355EB71E038',
    circuits: 'circom-1.0',
  });
  const contract1 = new MystikoContract(contractConfig);
  const mockContract = new MockContract(
    '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1',
    await readJsonFile('src/chain/abis/MystikoWithLoopERC20.json'),
    AssetType.ERC20,
    BridgeType.LOOP,
    '0xaE110b575E21949DEc823EfB81951355EB71E038',
    'USDT',
    18,
  );
  const contract2 = new MystikoContract(mockContract);
  expect(contract1.contract).toBe(undefined);
  expect(contract1.config).not.toBe(undefined);
  expect(contract2.config).toBe(undefined);
  expect(contract2.contract).not.toBe(undefined);
});

test('test MystikoContract connect', async () => {
  const address = '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1';
  const peerAddress = '0x8fb1df17768e29c936edfbce1207ad13696268b7';
  const assetAddress = '0xaE110b575E21949DEc823EfB81951355EB71E038';
  const contractConfig1 = new Contract({
    version: 1,
    name: 'MystikoWithLoopERC20',
    address: address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress,
    circuits: 'circom-1.0',
  });
  const contractConfig2 = new Contract({
    version: 1,
    name: 'MystikoWithLoopMain',
    address: address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    circuits: 'circom-1.0',
  });
  const contractConfig3 = new Contract({
    version: 1,
    name: 'MystikoWithPolyERC20',
    address: address,
    assetAddress,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    peerContractAddress: peerAddress,
    peerChainId: 56,
    circuits: 'circom-1.0',
  });
  const contractConfig4 = new Contract({
    version: 1,
    name: 'MystikoWithPolyMain',
    address: '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1',
    assetSymbol: 'ETH',
    assetDecimals: 18,
    peerContractAddress: peerAddress,
    peerChainId: 56,
    circuits: 'circom-1.0',
  });
  const contract1 = new MystikoContract(contractConfig1);
  const contract2 = new MystikoContract(contractConfig2);
  const contract3 = new MystikoContract(contractConfig3);
  const contract4 = new MystikoContract(contractConfig4);
  const contract1Connected = contract1.connect(undefined, (address, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(undefined);
    return new MockContract(address, abi, AssetType.ERC20, BridgeType.LOOP, assetAddress, 'USDT', 18);
  });
  const contract2Connected = contract2.connect(undefined, (address, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(undefined);
    return new MockContract(address, abi, AssetType.MAIN, BridgeType.LOOP);
  });
  const contract3Connected = contract3.connect(undefined, (address, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(undefined);
    return new MockContract(
      address,
      abi,
      AssetType.ERC20,
      BridgeType.POLY,
      assetAddress,
      'USDT',
      18,
      56,
      peerAddress,
    );
  });
  const contract4Connected = contract4.connect(undefined, (address, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(undefined);
    return new MockContract(
      address,
      abi,
      AssetType.MAIN,
      BridgeType.POLY,
      undefined,
      undefined,
      undefined,
      56,
      peerAddress,
    );
  });
  expect(contract1Connected instanceof ethers.Contract).toBe(true);
  expect(contract2Connected instanceof ethers.Contract).toBe(true);
  expect(contract3Connected instanceof ethers.Contract).toBe(true);
  expect(contract4Connected instanceof ethers.Contract).toBe(true);
  const abiData = await readJsonFile('src/chain/abis/MystikoWithLoopERC20.json');
  const rawContract = new ethers.Contract('0x98ED94360CAd67A76a53d8Aa15905E52485B73d1', abiData);
  const contract5 = new MystikoContract(rawContract);
  const contract5Connected = contract5.connect();
  expect(contract5Connected instanceof ethers.Contract).toBe(true);
});

test('test MystikoContract assetBalance', async () => {
  const address = '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1';
  const assetAddress = '0xaE110b575E21949DEc823EfB81951355EB71E038';
  const contractConfig1 = new Contract({
    version: 1,
    name: 'MystikoWithLoopERC20',
    address: address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress,
    assetType: AssetType.ERC20,
    circuits: 'circom-1.0',
  });
  const contractConfig2 = new Contract({
    version: 1,
    name: 'MystikoWithLoopMain',
    address: address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    assetType: AssetType.MAIN,
    circuits: 'circom-1.0',
  });
  const contract1 = new MystikoContract(contractConfig1);
  const contract2 = new MystikoContract(contractConfig2);
  const mockProvider = new MockProvider({
    [address]: toBN(1234),
  });
  contract1.connect(mockProvider);
  contract2.connect(mockProvider);
  const balance1 = await contract1.assetBalance((erc20Address, abi, providerOrSigner) => {
    expect(erc20Address).toBe(assetAddress);
    return new MockErc20Contract(address, abi, providerOrSigner, { [address]: toBN(3456) });
  });
  expect(balance1.toString()).toBe('3456');
  const balance2 = await contract2.assetBalance();
  expect(balance2.toString()).toBe('1234');
});

test('test ContractPool connect', async () => {
  expect(() => new ContractPool({})).toThrow();
  const conf = await readFromFile('tests/config/files/config.test.json');
  const db = await createDatabase('test.db');
  const contractHandler = new ContractHandler(db, conf);
  await contractHandler.importFromConfig();
  const providerPool = new ProviderPool(conf);
  providerPool.connect();
  const pool = new ContractPool(conf, contractHandler, providerPool);
  const contractGenerator = (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      return new ethers.Contract(address, MystikoABI.ERC20.abi, providerOrSigner);
    }
    expect(providerOrSigner).not.toBe(undefined);
    let mockContract = undefined;
    conf.chains.forEach((chainConfig) => {
      const chainId = chainConfig.chainId;
      conf.getChainConfig(chainId).contracts.forEach((contract) => {
        if (contract.address === address) {
          mockContract = new MockContract(
            address,
            abi,
            contract.assetType,
            contract.bridgeType,
            contract.assetAddress,
            contract.assetSymbol,
            contract.assetDecimals,
            contract.peerChainId,
            contract.peerContractAddress,
          );
        }
      });
    });
    expect(mockContract).not.toBe(undefined);
    return mockContract;
  };
  pool.connect(contractGenerator);
  expect(Object.keys(pool.pool).length).toBe(2);
  expect(Object.keys(pool.pool['1']).length).toBe(3);
  expect(Object.keys(pool.pool['56']).length).toBe(1);
  let depositContracts = pool.getDepositContracts(1, 56, 'USDT', BridgeType.POLY);
  expect(depositContracts.protocol.address).toBe('0x8fb1df17768e29c936edfbce1207ad13696268b7');
  expect(depositContracts.asset.address).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  depositContracts = pool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  expect(depositContracts.asset).toBe(undefined);
  expect(depositContracts.protocol.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  let withdrawContract = pool.getContract(56, '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  expect(withdrawContract.address).toBe('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  withdrawContract = pool.getContract(1, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(withdrawContract.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  withdrawContract = pool.getContract(1111, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(withdrawContract).toBe(undefined);
  withdrawContract = pool.getContract(1, '0x7Acfe657cC3eA9066CD748fbCd241cfA138DC879');
  expect(withdrawContract).toBe(undefined);
  db.database.close();
});
