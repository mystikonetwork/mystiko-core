// eslint-disable-next-line max-classes-per-file
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import { MystikoConfig, readFromFile } from '@mystiko/config';
import { toFixedLenHex, toBN } from '@mystiko/utils';
import {
  createDatabase,
  DepositStatus,
  PrivateNoteStatus,
  WithdrawStatus,
  ProviderPool,
  ContractPool,
  ContractHandler,
  DepositHandler,
  WithdrawHandler,
  WalletHandler,
  AccountHandler,
  NoteHandler,
  EventHandler,
  EventPuller,
  MystikoDatabase,
  Wallet,
} from '../../src';

class MockProvider extends ethers.providers.JsonRpcProvider {
  public testBlockNumber: number;

  public raiseError: boolean;

  constructor(url: string, raiseError: boolean = false) {
    super(url);
    this.testBlockNumber = 1000000;
    this.raiseError = raiseError;
  }

  public getBlockNumber() {
    if (this.raiseError) {
      throw new Error('error here');
    }
    this.testBlockNumber += 100;
    return Promise.resolve(this.testBlockNumber);
  }
}

class MockContract extends ethers.Contract {
  public queryFilter(topic: ethers.EventFilter, fromBlock: any, toBlock: any): Promise<ethers.Event[]> {
    expect(fromBlock <= toBlock).toBe(true);
    const rawEvents = [
      {
        event: 'Deposit',
        transactionHash: toFixedLenHex(randomBytes(32)),
        args: {
          amount: toBN(Math.floor(Math.random() * 1000)),
          commitmentHash:
            this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
              ? toFixedLenHex('0xdeadbeef')
              : toFixedLenHex(randomBytes(32)),
          encryptedNote: toFixedLenHex(randomBytes(32)),
        },
      },
      {
        event: 'Deposit',
        transactionHash: toFixedLenHex(randomBytes(32)),
        args: {
          amount: toBN(Math.floor(Math.random() * 1000)),
          commitmentHash:
            this.address === '0x98ed94360cad67a76a53d8aa15905e52485b73d1'
              ? toFixedLenHex('0xbeefdead')
              : toFixedLenHex(randomBytes(32)),
          encryptedNote: toFixedLenHex(randomBytes(32)),
        },
      },
      {
        event: 'MerkleTreeInsert',
        transactionHash: toFixedLenHex(randomBytes(32)),
        args: {
          amount: toBN(Math.floor(Math.random() * 1000)),
          leaf:
            this.address === '0x8fb1df17768e29c936edfbce1207ad13696268b7'
              ? toFixedLenHex('0xbaadbabe')
              : toFixedLenHex(randomBytes(32)),
          leafIndex: Math.floor(Math.random() * 10),
        },
      },
      {
        event: 'MerkleTreeInsert',
        transactionHash: toFixedLenHex(randomBytes(32)),
        args: {
          amount: toBN(Math.floor(Math.random() * 1000)),
          leaf:
            this.address === '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879'
              ? toFixedLenHex('0xbabebaad')
              : toFixedLenHex(randomBytes(32)),
          leafIndex: Math.floor(Math.random() * 10),
        },
      },
      {
        event: 'Withdraw',
        transactionHash: toFixedLenHex(randomBytes(32)),
        args: {
          rootHash:
            this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
              ? toBN(123456789)
              : toBN(Math.floor(Math.random() * 1000)),
          serialNumber:
            this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
              ? toBN(987654321)
              : toBN(Math.floor(Math.random() * 1000)),
          recipient: toFixedLenHex(randomBytes(20), 20),
        },
      },
      {
        event: 'Withdraw',
        transactionHash:
          this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
            ? '0x3f51321e83e5d2c9e8dc9236e48c98e95b471122350fa174f997c4f441a690a1'
            : toFixedLenHex(randomBytes(32)),
        args: {
          rootHash: toBN(Math.floor(Math.random() * 1000)),
          serialNumber: toBN(Math.floor(Math.random() * 1000)),
          recipient: toFixedLenHex(randomBytes(20), 20),
        },
      },
    ];
    return Promise.resolve(rawEvents.map(MockContract.convertToEthersEvent));
  }

  static convertToEthersEvent(object: any) {
    return object as ethers.Event;
  }
}

let db: MystikoDatabase;
let wallet: Wallet;
let config: MystikoConfig;
let providerPool: ProviderPool;
let contractPool: ContractPool;
let contractHandler: ContractHandler;
let eventHandler: EventHandler;
let walletHandler: WalletHandler;
let accountHandler: AccountHandler;
let noteHandler: NoteHandler;
let depositHandler: DepositHandler;
let withdrawHandler: WithdrawHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  config = await readFromFile('tests/config/config.test.json');
  providerPool = new ProviderPool(config);
  providerPool.connect((rpcEndPoints) => new MockProvider(rpcEndPoints[0]));
  contractHandler = new ContractHandler(db, config);
  await contractHandler.importFromConfig();
  contractPool = new ContractPool(config, providerPool);
  contractPool.connect(
    contractHandler.getContracts(),
    (address, abi, provider) => new MockContract(address, abi, provider),
  );
  eventHandler = new EventHandler(db, config);
  walletHandler = new WalletHandler(db, config);
  wallet = await walletHandler.createWallet(walletMasterSeed, walletPassword);
  accountHandler = new AccountHandler(walletHandler, db, config);
  noteHandler = new NoteHandler(
    walletHandler,
    accountHandler,
    contractHandler,
    providerPool,
    contractPool,
    db,
    config,
  );
  depositHandler = new DepositHandler(walletHandler, accountHandler, noteHandler, contractPool, db, config);
  withdrawHandler = new WithdrawHandler(
    walletHandler,
    accountHandler,
    contractHandler,
    noteHandler,
    providerPool,
    contractPool,
    db,
    config,
  );
});

test('test pulling behaviour', async () => {
  db.deposits.insert({
    commitmentHash: toBN('deadbeef', 16).toString(),
    srcChainId: 56,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  db.deposits.insert({
    commitmentHash: toBN('beefdead', 16).toString(),
    srcChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  db.deposits.insert({
    commitmentHash: toBN('baadbabe', 16).toString(),
    dstChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  db.deposits.insert({
    commitmentHash: toBN('babebaad', 16).toString(),
    dstChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  db.notes.insert({
    commitmentHash: toBN('baadbabe', 16).toString(),
    dstChainId: 1,
    walletId: wallet.id,
  });
  db.notes.insert({
    commitmentHash: toBN('babebaad', 16).toString(),
    dstChainId: 1,
    walletId: wallet.id,
  });
  db.notes.insert({
    withdrawTransactionHash: '0x3f51321e83e5d2c9e8dc9236e48c98e95b471122350fa174f997c4f441a690a1',
    dstChainId: 56,
    commitmentHash: toBN(Math.floor(Math.random() * 1000)).toString(),
    status: PrivateNoteStatus.IMPORTED,
    walletId: wallet.id,
  });
  db.withdraws.insert({
    merkleRootHash: toBN(123456789).toString(),
    serialNumber: toBN(987654321).toString(),
    chainId: 56,
    status: WithdrawStatus.PENDING,
    walletId: wallet.id,
    privateNoteId: 3,
  });
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    walletHandler,
    noteHandler,
    depositHandler,
    contractPool,
    eventHandler,
    withdrawHandler,
    isStoreEvent: true,
    pullIntervalMs: 1000,
  });
  const promise = eventPuller.start();
  expect(eventPuller.isStarted()).toBe(true);
  await promise;
  const sleepPromise = new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
  await sleepPromise;
  eventPuller.stop();
  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
  expect(eventPuller.isPending()).toBe(false);
  expect(depositHandler.getDeposit(1)?.status).toBe(DepositStatus.SRC_CONFIRMED);
  expect(depositHandler.getDeposit(2)?.status).toBe(DepositStatus.SUCCEEDED);
  expect(depositHandler.getDeposit(3)?.status).toBe(DepositStatus.SUCCEEDED);
  expect(depositHandler.getDeposit(4)?.status).toBe(DepositStatus.SUCCEEDED);
  expect(depositHandler.getDeposit(3)?.dstTxHash).not.toBe(undefined);
  expect(depositHandler.getDeposit(4)?.dstTxHash).not.toBe(undefined);
  expect(noteHandler.getPrivateNote(1)?.dstTransactionHash).not.toBe(undefined);
  expect(noteHandler.getPrivateNote(2)?.dstTransactionHash).not.toBe(undefined);
  expect(noteHandler.getPrivateNote(3)?.status).toBe(PrivateNoteStatus.SPENT);
  expect(withdrawHandler.getWithdraw(1)?.status).toBe(WithdrawStatus.SUCCEEDED);
  expect(eventPuller.isStarted()).toBe(false);
  expect(eventHandler.getEvents().length > 0).toBe(true);
  expect(eventPuller.getError()).toBe(undefined);
});

test('test skip storing events', async () => {
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    walletHandler,
    noteHandler,
    depositHandler,
    withdrawHandler,
    contractPool,
    eventHandler,
    isStoreEvent: false,
    pullIntervalMs: 1000,
  });
  const promise = eventPuller.start();
  expect(eventPuller.isStarted()).toBe(true);
  await promise;
  eventPuller.stop();
  expect(eventHandler.getEvents().length).toBe(0);
  expect(eventPuller.getError()).toBe(undefined);
});

test('test raise errors', async () => {
  providerPool.connect((rpcEndPoints) => new MockProvider(rpcEndPoints[0], true));
  contractPool.connect(
    contractHandler.getContracts(),
    (address, abi, provider) => new MockContract(address, abi, provider),
  );
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    walletHandler,
    noteHandler,
    depositHandler,
    withdrawHandler,
    contractPool,
    eventHandler,
    isStoreEvent: false,
    pullIntervalMs: 1000,
  });
  const promise = eventPuller.start();
  expect(eventPuller.isStarted()).toBe(true);
  await promise;
  eventPuller.stop();
  expect(eventPuller.getError()).not.toBe(undefined);
});

test('test no wallet', async () => {
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    walletHandler,
    noteHandler,
    depositHandler,
    withdrawHandler,
    contractPool,
    eventHandler,
    isStoreEvent: false,
    pullIntervalMs: 1000,
  });
  db.wallets.clear();
  const promise = eventPuller.start();
  expect(eventPuller.isStarted()).toBe(true);
  await promise;
  eventPuller.stop();
  expect(eventPuller.getError()).toBe(undefined);
});
