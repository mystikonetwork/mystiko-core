// eslint-disable-next-line max-classes-per-file
import BN from 'bn.js';
import { ContractInterface, ethers } from 'ethers';
import { AssetType, BridgeType, MystikoABI, readFromFile } from '@mystiko/config';
import { toBN } from '@mystiko/utils';
import {
  ContractPool,
  MystikoContract,
  ProviderPool,
  Contract,
  ContractHandler,
  createDatabase,
} from '../../src';

class MockContract extends ethers.Contract {
  private readonly mAssetType: AssetType;

  private readonly mBridgeType: BridgeType;

  private readonly mAssetAddress?: string;

  private readonly mAssetSymbol?: string;

  private readonly mAssetDecimals?: number;

  private readonly mPeerChainId?: number;

  private readonly mPeerContractAddress?: string;

  constructor(
    address: string,
    abi: any,
    assetType: AssetType,
    bridgeType: BridgeType,
    assetAddress?: string,
    assetSymbol?: string,
    assetDecimals?: number,
    peerChainId?: number,
    peerContractAddress?: string,
    providerOrSigner?: ethers.providers.Provider | ethers.Signer,
  ) {
    super(address, abi, providerOrSigner);
    this.mAssetType = assetType;
    this.mBridgeType = bridgeType;
    this.mAssetAddress = assetAddress;
    this.mAssetSymbol = assetSymbol;
    this.mAssetDecimals = assetDecimals;
    this.mPeerChainId = peerChainId;
    this.mPeerContractAddress = peerContractAddress;
  }

  public assetType() {
    return Promise.resolve(this.mAssetType);
  }

  public bridgeType() {
    return Promise.resolve(this.mBridgeType);
  }

  public asset() {
    return Promise.resolve(this.mAssetAddress);
  }

  public assetSymbol() {
    return Promise.resolve(this.mAssetSymbol);
  }

  public assetDecimals() {
    return Promise.resolve(this.mAssetDecimals);
  }

  public peerChainId() {
    return Promise.resolve(this.mPeerChainId);
  }

  public peerContractAddress() {
    return Promise.resolve(this.mPeerContractAddress);
  }
}

class MockErc20Contract extends ethers.Contract {
  private readonly balances: { [key: string]: BN };

  constructor(
    address: string,
    abi: any,
    providerOrSigner: ethers.providers.Provider | ethers.Signer,
    balances: { [key: string]: BN },
  ) {
    super(address, abi, providerOrSigner);
    this.balances = balances;
  }

  public balanceOf(address: string): Promise<BN> {
    if (this.balances[address]) {
      return Promise.resolve(this.balances[address]);
    }
    return Promise.resolve(toBN(0));
  }
}

class MockProvider extends ethers.providers.JsonRpcProvider {
  private readonly balances: { [key: string]: BN };

  constructor(balances: { [key: string]: BN }) {
    super();
    this.balances = balances;
  }

  public getBalance(address: string) {
    if (this.balances[address]) {
      return Promise.resolve(ethers.BigNumber.from(this.balances[address].toNumber()));
    }
    return Promise.resolve(ethers.BigNumber.from(0));
  }
}

test('test MystikoContract constructor', () => {
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
    MystikoABI.MystikoWithLoopERC20.abi,
    AssetType.ERC20,
    BridgeType.LOOP,
    '0xaE110b575E21949DEc823EfB81951355EB71E038',
    'USDT',
    18,
  );
  const contract2 = new MystikoContract(mockContract);
  expect(contract1.rawContract).toBe(undefined);
  expect(contract1.getConfig()).not.toBe(undefined);
  expect(contract2.getConfig()).toBe(undefined);
  expect(contract2.rawContract).not.toBe(undefined);
});

test('test MystikoContract connect', () => {
  const address = '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1';
  const peerAddress = '0x8fb1df17768e29c936edfbce1207ad13696268b7';
  const assetAddress = '0xaE110b575E21949DEc823EfB81951355EB71E038';
  const contractConfig1 = new Contract({
    version: 1,
    name: 'MystikoWithLoopERC20',
    address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress,
    circuits: 'circom-1.0',
  });
  const contractConfig2 = new Contract({
    version: 1,
    name: 'MystikoWithLoopMain',
    address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    circuits: 'circom-1.0',
  });
  const contractConfig3 = new Contract({
    version: 1,
    name: 'MystikoWithPolyERC20',
    address,
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
  const contractConfig5 = new Contract({
    version: 1,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    peerContractAddress: peerAddress,
    peerChainId: 56,
    circuits: 'circom-1.0',
  });
  const provider = new MockProvider({});
  const contract1 = new MystikoContract(contractConfig1);
  const contract2 = new MystikoContract(contractConfig2);
  const contract3 = new MystikoContract(contractConfig3);
  const contract4 = new MystikoContract(contractConfig4);
  const contract5 = new MystikoContract(contractConfig5);
  const contract1Connected = contract1.connect(provider, (addr, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(provider);
    return new MockContract(addr, abi, AssetType.ERC20, BridgeType.LOOP, assetAddress, 'USDT', 18);
  });
  const contract2Connected = contract2.connect(provider, (addr, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(provider);
    return new MockContract(addr, abi, AssetType.MAIN, BridgeType.LOOP, undefined, 'ETH', 18);
  });
  const contract3Connected = contract3.connect(provider, (addr, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(provider);
    return new MockContract(
      addr,
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
  const contract4Connected = contract4.connect(provider, (addr, abi, providerOrSinger) => {
    expect(providerOrSinger).toBe(provider);
    return new MockContract(
      addr,
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
  expect(() => contract5.connect(provider)).toThrow();
  const abiData = MystikoABI.MystikoWithLoopERC20.abi;
  const rawContract = new ethers.Contract('0x98ED94360CAd67A76a53d8Aa15905E52485B73d1', abiData);
  const contract6 = new MystikoContract(rawContract);
  const contract6Connected = contract6.connect(provider);
  expect(contract6Connected instanceof ethers.Contract).toBe(true);
});

test('test MystikoContract assetBalance', async () => {
  const address = '0x98ED94360CAd67A76a53d8Aa15905E52485B73d1';
  const assetAddress = '0xaE110b575E21949DEc823EfB81951355EB71E038';
  const contractConfig1 = new Contract({
    version: 1,
    name: 'MystikoWithLoopERC20',
    address,
    assetSymbol: 'USDT',
    assetDecimals: 18,
    assetAddress,
    assetType: AssetType.ERC20,
    circuits: 'circom-1.0',
  });
  const contractConfig2 = new Contract({
    version: 1,
    name: 'MystikoWithLoopMain',
    address,
    assetSymbol: 'ETH',
    assetDecimals: 18,
    assetType: AssetType.MAIN,
    circuits: 'circom-1.0',
  });
  const contract1 = new MystikoContract(contractConfig1);
  const contract2 = new MystikoContract(contractConfig2);
  const contract3 = new MystikoContract(new ethers.Contract(address, MystikoABI.MystikoWithLoopERC20.abi));
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
  await expect(contract3.assetBalance()).rejects.toThrow();
});

test('test ContractPool connect', async () => {
  const conf = await readFromFile('tests/config/config.test.json');
  const db = await createDatabase('test.db');
  const contractHandler = new ContractHandler(db, conf);
  await contractHandler.importFromConfig();
  const providerPool = new ProviderPool(conf);
  providerPool.connect();
  const pool = new ContractPool(conf, providerPool);
  const contractGenerator = (
    address: string,
    abi: ContractInterface,
    providerOrSigner: ethers.providers.Provider | ethers.Signer,
  ) => {
    if (abi === MystikoABI.ERC20.abi) {
      return new ethers.Contract(address, MystikoABI.ERC20.abi, providerOrSigner);
    }
    expect(providerOrSigner).not.toBe(undefined);
    let mockContract;
    conf.chains.forEach((chainConfig) => {
      const { chainId } = chainConfig;
      conf.getChainConfig(chainId)?.contracts.forEach((contract) => {
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
    if (!mockContract) {
      throw new Error('mockContract is undefined');
    }
    return mockContract;
  };
  pool.connect(contractHandler.getContracts(), contractGenerator);
  let depositContracts = pool.getDepositContracts(1, 56, 'USDT', BridgeType.POLY);
  expect(depositContracts?.protocol.address).toBe('0x8fb1df17768e29c936edfbce1207ad13696268b7');
  expect(depositContracts?.asset?.address).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  depositContracts = pool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  expect(depositContracts?.asset).toBe(undefined);
  expect(depositContracts?.protocol.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  let withdrawContract = pool.getContract(56, '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  expect(withdrawContract?.address).toBe('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  withdrawContract = pool.getContract(1, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(withdrawContract?.address).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  withdrawContract = pool.getContract(1111, '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(withdrawContract).toBe(undefined);
  withdrawContract = pool.getContract(1, '0x7Acfe657cC3eA9066CD748fbCd241cfA138DC879');
  expect(withdrawContract).toBe(undefined);
  const pool2 = new ContractPool(conf, providerPool);
  pool2.connect(
    contractHandler.getContracts({
      filterFunc: (contract) => contract.address !== '0x8fb1df17768e29c936edfbce1207ad13696268b7',
    }),
  );
  expect(() => pool2.getDepositContracts(1, 56, 'USDT', BridgeType.POLY)).toThrow();
  db.database.close();
});
