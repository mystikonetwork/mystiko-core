// eslint-disable-next-line max-classes-per-file
import BN from 'bn.js';
import { ethers } from 'ethers';
import { AssetType, BridgeType, MystikoABI, MystikoConfig, readFromFile } from '@mystiko/config';
import { toBN, toDecimals, toHex } from '@mystiko/utils';
import {
  AccountHandler,
  BaseSigner,
  ContractHandler,
  ContractPool,
  createDatabase,
  Deposit,
  DepositHandler,
  DepositStatus,
  MystikoDatabase,
  NoteHandler,
  ProviderPool,
  WalletHandler,
} from '../../src';
import txReceipt01 from './files/txReceipt01.json';

class MockTransactionResponse {
  private readonly errorMessage?: string;

  private readonly expectedToAddress?: string;

  public readonly hash: string;

  constructor(errorMessage?: string, expectedToAddress?: string) {
    this.errorMessage = errorMessage;
    this.hash = toHex(ethers.utils.randomBytes(32));
    this.expectedToAddress = expectedToAddress;
  }

  public wait() {
    return new Promise((resolve, reject) => {
      if (!this.errorMessage) {
        txReceipt01.transactionHash = this.hash;
        txReceipt01.to = this.expectedToAddress || '';
        resolve(txReceipt01);
      } else {
        reject(this.errorMessage);
      }
    });
  }
}

class MockERC20Contract extends ethers.Contract {
  public readonly allowances: { [key: string]: { [key: string]: BN } };

  private readonly defaultOwner: string;

  public approveCount: number;

  public tx?: MockTransactionResponse;

  private readonly balance: number;

  constructor(address: string, abi: any, defaultOwner: string, balance: number) {
    super(address, abi);
    this.allowances = { [defaultOwner]: {} };
    this.defaultOwner = defaultOwner;
    this.approveCount = 0;
    this.balance = balance;
  }

  public connect(providerOrSigner: any) {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  public balanceOf(address: string) {
    expect(address).toBe(this.defaultOwner);
    return Promise.resolve(toDecimals(this.balance, 18));
  }

  public allowance(owner: string, spender: string) {
    return new Promise((resolve) => {
      if (this.allowances[owner] && this.allowances[owner][spender]) {
        resolve(this.allowances[owner][spender]);
      } else {
        resolve(toBN(0));
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public decimals() {
    return Promise.resolve(18);
  }

  public approve(spender: string, amount: string) {
    return new Promise((resolve) => {
      this.allowances[this.defaultOwner][spender] = toBN(amount);
      this.approveCount += 1;
      this.tx = new MockTransactionResponse();
      resolve(this.tx);
    });
  }
}

class MockMystikoContract extends ethers.Contract {
  public errorMessage?: string;

  private readonly isMain: boolean;

  private readonly minBridgeFee: BN;

  public tx?: MockTransactionResponse;

  public depositedCommitmentHashes: { [key: string]: boolean } = {};

  public relayCommitmentHashes: { [key: string]: boolean } = {};

  constructor(
    address: string,
    abi: any,
    providerOrSigner: ethers.providers.Provider | ethers.Signer,
    errorMessage?: string,
    isMain?: boolean,
    minBridgeFee?: BN,
  ) {
    super(address, abi, providerOrSigner);
    this.errorMessage = errorMessage;
    this.isMain = isMain || false;
    this.minBridgeFee = minBridgeFee || new BN(0);
  }

  public depositedCommitments(commitmentHash: string): Promise<boolean> {
    return Promise.resolve(!!this.depositedCommitmentHashes[commitmentHash]);
  }

  public relayCommitments(commitmentHash: string): Promise<boolean> {
    return Promise.resolve(!!this.relayCommitmentHashes[commitmentHash]);
  }

  public connect(providerOrSigner: any) {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  public deposit(
    amount: string,
    commitmentHash: string,
    hashK: string,
    randomS: string,
    privateNote: string,
    params: { value?: string },
  ) {
    const numberPattern = /^[0-9]*$/;
    expect(amount.match(numberPattern)).not.toBe(null);
    expect(commitmentHash.startsWith('0x') && commitmentHash.length === 66);
    expect(hashK.startsWith('0x') && hashK.length === 66);
    expect(randomS.startsWith('0x') && randomS.length === 66);
    expect(privateNote.startsWith('0x'));
    if (this.isMain) {
      expect(params.value).toBe(this.minBridgeFee.add(new BN(amount)).toString());
    } else {
      expect(params.value).toBe(this.minBridgeFee.toString());
    }
    return new Promise((resolve, reject) => {
      if (this.errorMessage) {
        reject(this.errorMessage);
      } else {
        this.tx = new MockTransactionResponse(undefined, this.address);
        resolve(this.tx);
      }
    });
  }
}

class MockWallet extends ethers.Wallet {
  private readonly expectedAddress: string;

  private readonly expectedBalance: number;

  constructor(expectedAddress: string, expectedBalance: number) {
    super(ethers.Wallet.createRandom().privateKey);
    this.expectedAddress = expectedAddress;
    this.expectedBalance = expectedBalance;
  }

  public getAddress(): Promise<string> {
    return Promise.resolve(this.expectedAddress);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getBalance(blockTag?: any): Promise<ethers.BigNumber> {
    return Promise.resolve(ethers.BigNumber.from(toDecimals(this.expectedBalance, 18).toString()));
  }
}

class MockSigner extends BaseSigner {
  private readonly expectedAddress: string;

  private readonly expectedChainId: number;

  private readonly expectedBalance: number;

  constructor(
    conf: MystikoConfig,
    expectedAddress: string,
    expectedChainId: number,
    expectedBalance: number,
  ) {
    super(conf);
    this.expectedAddress = expectedAddress;
    this.expectedChainId = expectedChainId;
    this.expectedBalance = expectedBalance;
  }

  // eslint-disable-next-line class-methods-use-this
  public connected() {
    return Promise.resolve(true);
  }

  public get signer() {
    return new MockWallet(this.expectedAddress, this.expectedBalance);
  }

  public chainId() {
    return Promise.resolve(toHex(this.expectedChainId));
  }
}

let db: MystikoDatabase;
let conf: MystikoConfig;
let providerPool: ProviderPool;
let contractPool: ContractPool;
let walletHandler: WalletHandler;
let accountHandler: AccountHandler;
let contractHandler: ContractHandler;
let noteHandler: NoteHandler;
let depositHandler: DepositHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/config.test.json');
  providerPool = new ProviderPool(conf);
  providerPool.connect();
  contractHandler = new ContractHandler(db, conf);
  await contractHandler.importFromConfig();
  contractPool = new ContractPool(conf, providerPool);
  walletHandler = new WalletHandler(db, conf);
  accountHandler = new AccountHandler(walletHandler, db, conf);
  noteHandler = new NoteHandler(
    walletHandler,
    accountHandler,
    contractHandler,
    providerPool,
    contractPool,
    db,
    conf,
  );
  depositHandler = new DepositHandler(walletHandler, accountHandler, noteHandler, contractPool, db, conf);
  await walletHandler.createWallet(walletMasterSeed, walletPassword);
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 500);
    }
    return new MockMystikoContract(address, abi, providerOrSigner);
  });
});

afterEach(() => {
  db.database.close();
});

test('test createDeposit poly erc20', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'USDT',
    bridge: BridgeType.POLY,
    amount: 100,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const contracts = contractPool.getDepositContracts(1, 56, 'USDT', BridgeType.POLY);
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 0);
  let cbCount = 0;
  const cb = (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => {
    expect(deposit.status).toBe(newStatus);
    expect(oldStatus).not.toBe(newStatus);
    cbCount += 1;
  };
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer, cb);
  expect(deposit.srcChainId).toBe(1);
  expect(deposit.dstChainId).toBe(56);
  expect(deposit.bridge).toBe(BridgeType.POLY);
  expect(deposit.asset).toBe('USDT');
  expect(deposit.assetType).toBe(AssetType.ERC20);
  expect(deposit.assetDecimals).toBe(18);
  expect(deposit.amount?.toString()).toBe(toDecimals(100, 18).toString());
  expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
  expect(depositPromise).not.toBe(undefined);
  await depositPromise;
  const deposit1 = depositHandler.getDeposit(deposit);
  expect(deposit1?.errorMessage).toBe(undefined);
  if (contracts.asset) {
    const wrappedAssetContract = contracts.asset as MockERC20Contract;
    expect(wrappedAssetContract.approveCount).toBe(1);
    expect(wrappedAssetContract.tx).not.toBe(undefined);
    expect(deposit1?.assetApproveTxHash).toBe(contracts.asset.tx.hash);
    expect((contracts.protocol as MockMystikoContract).tx).not.toBe(undefined);
    expect(deposit1?.srcTxHash).toBe((contracts.protocol as MockMystikoContract).tx?.hash);
    expect(cbCount).toBe(4);
    expect(deposit1?.status).toBe(DepositStatus.SRC_CONFIRMED);
  }
  expect(contracts.asset).not.toBe(undefined);
});

test('test createDeposit loop erc20', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const contracts = contractPool.getDepositContracts(1, 1, 'USDT', BridgeType.LOOP);
  if (contracts.asset) {
    const wrappedAssetContract = contracts.asset as MockERC20Contract;
    wrappedAssetContract.allowances['0x7dfb6962c9974bf6334ab587b77030515886e96f'][
      '0x98ed94360cad67a76a53d8aa15905e52485b73d1'
    ] = toDecimals(200, 18);
    const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 0);
    const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
    expect(deposit.srcChainId).toBe(1);
    expect(deposit.dstChainId).toBe(1);
    expect(deposit.bridge).toBe(BridgeType.LOOP);
    expect(deposit.asset).toBe('USDT');
    expect(deposit.assetType).toBe(AssetType.ERC20);
    expect(deposit.assetDecimals).toBe(18);
    expect(deposit.amount?.toString()).toBe(toDecimals(200, 18).toString());
    expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
    expect(depositPromise).not.toBe(undefined);
    await depositPromise;
    const deposit1 = depositHandler.getDeposit(deposit);
    expect(deposit1?.errorMessage).toBe(undefined);
    expect(wrappedAssetContract.approveCount).toBe(0);
    expect(wrappedAssetContract.tx).toBe(undefined);
    expect(deposit1?.assetApproveTxHash).toBe(undefined);
    expect(contracts.protocol.tx).not.toBe(undefined);
    expect(deposit1?.srcTxHash).toBe(contracts.protocol.tx.hash);
    expect(deposit1?.status).toBe(DepositStatus.SUCCEEDED);
  } else {
    expect(contracts.asset).not.toBe(undefined);
  }
});

test('test createDeposit loop main', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  const contracts = contractPool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 500);
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
  expect(deposit.srcChainId).toBe(1);
  expect(deposit.dstChainId).toBe(1);
  expect(deposit.bridge).toBe(BridgeType.LOOP);
  expect(deposit.asset).toBe('ETH');
  expect(deposit.assetType).toBe(AssetType.MAIN);
  expect(deposit.assetDecimals).toBe(18);
  expect(deposit.amount?.toString()).toBe(toDecimals(500, 18).toString());
  expect(deposit.shieldedRecipientAddress).toBe(request.shieldedAddress);
  expect(depositPromise).not.toBe(undefined);
  await depositPromise;
  const deposit1 = depositHandler.getDeposit(deposit);
  expect(deposit1?.errorMessage).toBe(undefined);
  expect(contracts.asset).toBe(undefined);
  expect(deposit1?.assetApproveTxHash).toBe(undefined);
  expect((contracts.protocol as MockMystikoContract).tx).not.toBe(undefined);
  expect(deposit1?.srcTxHash).toBe(contracts.protocol.tx.hash);
  expect(deposit1?.status).toBe(DepositStatus.SUCCEEDED);
});

test('test createDeposit loop error', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 500);
  const contracts = contractPool.getDepositContracts(1, 1, 'ETH', BridgeType.LOOP);
  (contracts.protocol as MockMystikoContract).errorMessage = 'error here';
  const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
  await depositPromise;
  const deposit1 = depositHandler.getDeposit(deposit);
  expect(deposit1?.errorMessage).toBe('error here');
  expect(deposit1?.status).toBe(DepositStatus.FAILED);
});

test('test auto import privateNote', async () => {
  const account = await accountHandler.importAccountFromSecretKey(
    walletPassword,
    'account 1',
    '038e95e5d94292956a3476342c16346b4b7033fa7f6827560dab890cb6eca1' +
      'ab0aa2663250e332cbca03ff300dae0220ba029af87a2f1f166d29e9c4d102d87c',
  );
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress: account.shieldedAddress || '',
  };
  const contracts = contractPool.getDepositContracts(1, 1, 'USDT', BridgeType.LOOP);
  if (contracts.asset) {
    const wrappedAssetContract = contracts.asset as MockERC20Contract;
    wrappedAssetContract.allowances['0x7dfb6962c9974bf6334ab587b77030515886e96f'][
      '0x98ed94360cad67a76a53d8aa15905e52485b73d1'
    ] = toDecimals(200, 18);
    const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 0);
    const { deposit, depositPromise } = await depositHandler.createDeposit(request, signer);
    await depositPromise;
    const deposit1 = depositHandler.getDeposit(deposit);
    const privateNote = noteHandler.getPrivateNote(1);
    expect(deposit1?.errorMessage).toBe(undefined);
    expect(privateNote).not.toBe(undefined);
    const deposit2 = new Deposit(deposit1 || {});
    deposit2.commitmentHash = privateNote?.commitmentHash;
    // @ts-ignore
    await depositHandler.createPrivateNoteIfNecessary(deposit2, txReceipt01);
    expect(noteHandler.getPrivateNotes().length).toBe(1);
  }
});

test('test query deposits', async () => {
  const request1 = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const request2 = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 500,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  const request3 = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'USDT',
    bridge: BridgeType.POLY,
    amount: 100,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 500);
  const ret1 = await depositHandler.createDeposit(request1, signer);
  await ret1.depositPromise;
  expect(ret1.deposit.errorMessage).toBe(undefined);

  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 500);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined);
  });
  const ret2 = await depositHandler.createDeposit(request2, signer);
  await ret2.depositPromise;
  expect(depositHandler.getDeposit(ret2.deposit || -1)?.errorMessage).toBe(undefined);
  const ret3 = await depositHandler.createDeposit(request3, signer);
  await ret3.depositPromise;
  expect(depositHandler.getDeposit(ret3.deposit || -1)?.errorMessage).toBe(undefined);
  expect(depositHandler.getDeposit(1)?.srcTxHash).toBe(
    depositHandler.getDeposit(ret1.deposit || -1)?.srcTxHash,
  );
  expect(depositHandler.getDeposit(10000)).toBe(undefined);
  expect(depositHandler.getDeposit('wrong tx hash')).toBe(undefined);
  const srcTxHash = depositHandler.getDeposit(3)?.srcTxHash || '';
  expect(depositHandler.getDeposit(srcTxHash)?.id).toBe(3);
  expect(depositHandler.getDeposit(ret2.deposit)?.id).toBe(2);
  expect(depositHandler.getDepositsCount()).toBe(3);
  expect(depositHandler.getDepositsCount((d) => d.bridge === BridgeType.LOOP)).toBe(2);
  expect(
    depositHandler.getDeposits({
      filterFunc: (d) => d.bridge === BridgeType.LOOP,
      offset: 1,
      limit: 10,
    }).length,
  ).toBe(1);
  expect(
    depositHandler
      .getDeposits({
        sortBy: 'amount',
        desc: true,
      })
      .map((d) => d.id),
  ).toStrictEqual([2, 1, 3]);
  expect(
    depositHandler
      .getDeposits({
        sortBy: 'id',
        desc: true,
      })
      .map((d) => d.id),
  ).toStrictEqual([3, 2, 1]);
  let deposit = depositHandler.getDeposit(1);
  if (deposit) {
    const oldStatus = deposit.status || DepositStatus.INIT;
    deposit = await depositHandler.updateDepositStatus(deposit, oldStatus);
    expect(deposit.status).toBe(oldStatus);
  }
  db.wallets.findAndRemove();
  expect(depositHandler.getDeposits()).toStrictEqual([]);
});

test('test exportOffChainNote', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 500);
  const ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).toBe(undefined);
  expect(() => depositHandler.exportOffChainNote(1000)).toThrow();
  const offChainNote = depositHandler.exportOffChainNote(ret.deposit || -1);
  expect(offChainNote.chainId).toBe(ret.deposit.srcChainId);
  expect(offChainNote.transactionHash).toBe(depositHandler.getDeposit(ret.deposit || -1)?.srcTxHash);
  const { deposit } = ret;
  if (deposit) {
    db.deposits.update({ ...deposit.data, srcChainId: undefined });
    expect(() => depositHandler.exportOffChainNote(deposit)).toThrow();
    db.deposits.update({ ...deposit.data, srcTxHash: undefined });
    expect(() => depositHandler.exportOffChainNote(deposit)).toThrow();
  }
});

test('test insufficient balance', async () => {
  let request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'ETH',
    bridge: BridgeType.LOOP,
    amount: 600,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  const signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 500);
  let ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).not.toBe(undefined);
  request = {
    srcChainId: 1,
    dstChainId: 1,
    assetSymbol: 'USDT',
    bridge: BridgeType.LOOP,
    amount: 600,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 100);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true);
  });
  ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).not.toBe(undefined);
});

test('test minBridgeFee main token', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'ETH',
    bridge: BridgeType.CELER,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 0);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, true, new BN(1000));
  });
  let signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 200);
  let ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).not.toBe(undefined);
  signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 300);
  ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).toBe(undefined);
});

test('test minBridgeFee erc20', async () => {
  const request = {
    srcChainId: 1,
    dstChainId: 56,
    assetSymbol: 'USDT',
    bridge: BridgeType.CELER,
    amount: 200,
    shieldedAddress:
      'Jc29nDcY9js9EtgeVkcE6w24eTpweTXZjr4TxaMSUB8fbxoLyovKU3Z89tPLrkmjHX4NvXfaKX676yW1sKTbXoJZ5',
  };
  await contractPool.connect(contractHandler.getContracts(), (address, abi, providerOrSigner) => {
    if (abi === MystikoABI.ERC20.abi) {
      const defaultOwner = '0x7dfb6962c9974bf6334ab587b77030515886e96f';
      return new MockERC20Contract(address, abi, defaultOwner, 200);
    }
    return new MockMystikoContract(address, abi, providerOrSigner, undefined, false, toDecimals(2));
  });
  let signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 1);
  let ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).not.toBe(undefined);
  signer = new MockSigner(conf, '0x7dfb6962c9974bf6334ab587b77030515886e96f', 1, 2);
  ret = await depositHandler.createDeposit(request, signer);
  await ret.depositPromise;
  expect(depositHandler.getDeposit(ret.deposit || -1)?.errorMessage).toBe(undefined);
});

test('test depositRelayed', async () => {
  await expect(depositHandler.depositRelayed(100)).rejects.toThrow();
  const deposit1 = new Deposit(db.deposits.insert({}));
  await expect(depositHandler.depositRelayed(deposit1)).rejects.toThrow();
  const deposit2 = new Deposit(db.deposits.insert({ srcChainId: 1 }));
  await expect(depositHandler.depositRelayed(deposit2)).rejects.toThrow();
  const deposit3 = new Deposit(db.deposits.insert({ srcChainId: 1, dstChainId: 1 }));
  await expect(depositHandler.depositRelayed(deposit3)).rejects.toThrow();
  const deposit4 = new Deposit(db.deposits.insert({ srcChainId: 1, dstChainId: 1, bridge: BridgeType.LOOP }));
  await expect(depositHandler.depositRelayed(deposit4)).rejects.toThrow();
  const deposit5 = new Deposit(
    db.deposits.insert({ srcChainId: 1, dstChainId: 1, bridge: BridgeType.LOOP, asset: 'USDT' }),
  );
  await expect(depositHandler.depositRelayed(deposit5)).rejects.toThrow();
  const deposit6 = new Deposit(
    db.deposits.insert({
      srcChainId: 1,
      dstChainId: 100,
      bridge: BridgeType.TBRIDGE,
      asset: 'USDT',
      commitmentHash: '12345',
    }),
  );
  expect(() => depositHandler.depositRelayed(deposit6)).toThrow();
  const deposit7 = new Deposit(
    db.deposits.insert({
      srcChainId: 1,
      dstChainId: 1,
      bridge: BridgeType.LOOP,
      asset: 'USDT',
      commitmentHash: '12345',
    }),
  );
  expect(await depositHandler.depositRelayed(deposit7)).toBe(false);
  const loopContract = contractPool.getContract(1, '0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  if (loopContract) {
    (loopContract as MockMystikoContract).depositedCommitmentHashes['12345'] = false;
    expect(await depositHandler.depositRelayed(deposit7)).toBe(false);
    (loopContract as MockMystikoContract).depositedCommitmentHashes[
      '0x0000000000000000000000000000000000000000000000000000000000003039'
    ] = true;
    expect(await depositHandler.depositRelayed(deposit7)).toBe(true);
  } else {
    throw new Error('contract does not exist');
  }
  const deposit8 = new Deposit(
    db.deposits.insert({
      srcChainId: 1,
      dstChainId: 56,
      bridge: BridgeType.POLY,
      asset: 'USDT',
      commitmentHash: '12345',
    }),
  );
  expect(await depositHandler.depositRelayed(deposit8)).toBe(false);
  const polyContract = contractPool.getContract(56, '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  if (polyContract) {
    (polyContract as MockMystikoContract).relayCommitmentHashes['12345'] = false;
    expect(await depositHandler.depositRelayed(deposit8)).toBe(false);
    (polyContract as MockMystikoContract).relayCommitmentHashes[
      '0x0000000000000000000000000000000000000000000000000000000000003039'
    ] = true;
    expect(await depositHandler.depositRelayed(deposit8)).toBe(true);
  } else {
    throw new Error('contract does not exist');
  }
  depositHandler = new DepositHandler(
    walletHandler,
    accountHandler,
    noteHandler,
    new ContractPool(conf, providerPool),
    db,
    conf,
  );
  await expect(depositHandler.depositRelayed(deposit8)).rejects.toThrow();
});
