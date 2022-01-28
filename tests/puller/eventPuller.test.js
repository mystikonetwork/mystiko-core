import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import BN from 'bn.js';
import { ProviderPool } from '../../src/chain/provider.js';
import { ContractPool } from '../../src/chain/contract.js';
import { readFromFile } from '../../src/config';
import { ContractHandler } from '../../src/handler/contractHandler.js';
import { createDatabase } from '../../src/database.js';
import { DepositHandler } from '../../src/handler/depositHandler.js';
import { WithdrawHandler } from '../../src/handler/withdrawHandler.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { AccountHandler } from '../../src/handler/accountHandler.js';
import { NoteHandler } from '../../src/handler/noteHandler.js';
import { EventHandler } from '../../src/handler/eventHandler.js';
import { EventPuller } from '../../src/puller';
import { toFixedLenHex } from '../../src/utils.js';
import { DepositStatus, PrivateNoteStatus, WithdrawStatus } from '../../src/model';

class MockProvider extends ethers.providers.JsonRpcProvider {
  constructor(url, raiseError = false) {
    super(url);
    this.testBlockNumber = 1000000;
    this.raiseError = raiseError;
  }

  getBlockNumber() {
    if (this.raiseError) {
      throw new Error('error here');
    }
    this.testBlockNumber = this.testBlockNumber + 100;
    return Promise.resolve(this.testBlockNumber);
  }
}

class MockContract extends ethers.Contract {
  constructor(address, abi, providerOrSigner) {
    super(address, abi, providerOrSigner);
  }

  queryFilter(topic, fromBlock, toBlock) {
    expect(fromBlock <= toBlock).toBe(true);
    if (topic === 'Deposit') {
      return Promise.resolve([
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            commitmentHash:
              this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
                ? toFixedLenHex('0xdeadbeef')
                : toFixedLenHex(randomBytes(32)),
            encryptedNote: toFixedLenHex(randomBytes(32)),
          },
        },
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            commitmentHash:
              this.address === '0x98ed94360cad67a76a53d8aa15905e52485b73d1'
                ? toFixedLenHex('0xbeefdead')
                : toFixedLenHex(randomBytes(32)),
            encryptedNote: toFixedLenHex(randomBytes(32)),
          },
        },
      ]);
    } else if (topic === 'MerkleTreeInsert') {
      return Promise.resolve([
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            leaf:
              this.address === '0x8fb1df17768e29c936edfbce1207ad13696268b7'
                ? toFixedLenHex('0xbaadbabe')
                : toFixedLenHex(randomBytes(32)),
            leafIndex: Math.floor(Math.random() * 10),
          },
        },
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            leaf:
              this.address === '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879'
                ? toFixedLenHex('0xbabebaad')
                : toFixedLenHex(randomBytes(32)),
            leafIndex: Math.floor(Math.random() * 10),
          },
        },
      ]);
    } else if (topic === 'Withdraw') {
      return Promise.resolve([
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            rootHash:
              this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
                ? new BN(123456789)
                : new BN(Math.floor(Math.random() * 1000)),
            serialNumber:
              this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
                ? new BN(987654321)
                : new BN(Math.floor(Math.random() * 1000)),
            recipient: toFixedLenHex(randomBytes(20), 20),
          },
        },
        {
          transactionHash:
            this.address === '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67'
              ? '0x3f51321e83e5d2c9e8dc9236e48c98e95b471122350fa174f997c4f441a690a1'
              : toFixedLenHex(randomBytes(32)),
          args: {
            rootHash: new BN(Math.floor(Math.random() * 1000)),
            serialNumber: new BN(Math.floor(Math.random() * 1000)),
            recipient: toFixedLenHex(randomBytes(20), 20),
          },
        },
      ]);
    } else {
      return Promise.resolve([]);
    }
  }
}

let db;
let wallet;
let config;
let providerPool;
let contractPool;
let contractHandler;
let eventHandler;
let walletHandler;
let accountHandler;
let noteHandler;
let depositHandler;
let withdrawHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  config = await readFromFile('tests/config/files/config.test.json');
  providerPool = new ProviderPool(config);
  providerPool.connect((rpcEndPoints) => {
    return new MockProvider(rpcEndPoints[0]);
  });
  contractPool = new ContractPool(config, providerPool);
  contractPool.connect((address, abi, provider) => new MockContract(address, abi, provider));
  contractHandler = new ContractHandler(db, config);
  await contractHandler.importFromConfig();
  eventHandler = new EventHandler(db, config);
  walletHandler = new WalletHandler(db, config);
  wallet = await walletHandler.createWallet(walletMasterSeed, walletPassword);
  accountHandler = new AccountHandler(walletHandler, db, config);
  noteHandler = new NoteHandler(walletHandler, accountHandler, providerPool, db, config);
  depositHandler = new DepositHandler(walletHandler, accountHandler, noteHandler, contractPool, db, config);
  withdrawHandler = new WithdrawHandler(
    walletHandler,
    accountHandler,
    noteHandler,
    providerPool,
    contractPool,
    db,
    config,
  );
});

test('test pulling behaviour', async () => {
  const deposit1 = db.deposits.insert({
    commitmentHash: new BN('deadbeef', 16).toString(),
    srcChainId: 56,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  const deposit2 = db.deposits.insert({
    commitmentHash: new BN('beefdead', 16).toString(),
    srcChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  const deposit3 = db.deposits.insert({
    commitmentHash: new BN('baadbabe', 16).toString(),
    dstChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  const deposit4 = db.deposits.insert({
    commitmentHash: new BN('babebaad', 16).toString(),
    dstChainId: 1,
    status: DepositStatus.SRC_PENDING,
    walletId: wallet.id,
  });
  const note1 = db.notes.insert({
    commitmentHash: new BN('baadbabe', 16).toString(),
    dstChainId: 1,
    walletId: wallet.id,
  });
  const note2 = db.notes.insert({
    commitmentHash: new BN('babebaad', 16).toString(),
    dstChainId: 1,
    walletId: wallet.id,
  });
  const note3 = db.notes.insert({
    withdrawTransactionHash: '0x3f51321e83e5d2c9e8dc9236e48c98e95b471122350fa174f997c4f441a690a1',
    dstChainId: 56,
    commitmentHash: new BN(Math.floor(Math.random() * 1000)),
    status: PrivateNoteStatus.IMPORTED,
    walletId: wallet.id,
  });
  const withdraw = db.withdraws.insert({
    merkleRootHash: new BN(123456789).toString(),
    serialNumber: new BN(987654321).toString(),
    chainId: 56,
    status: WithdrawStatus.PENDING,
    walletId: wallet.id,
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
  const sleepPromise = new Promise((resolve) => setTimeout(resolve, 2000));
  await sleepPromise;
  eventPuller.stop();
  expect(deposit1['status']).toBe(DepositStatus.SRC_CONFIRMED);
  expect(deposit2['status']).toBe(DepositStatus.SUCCEEDED);
  expect(deposit3['status']).toBe(DepositStatus.SUCCEEDED);
  expect(deposit4['status']).toBe(DepositStatus.SUCCEEDED);
  expect(deposit3['dstTxHash']).not.toBe(undefined);
  expect(deposit4['dstTxHash']).not.toBe(undefined);
  expect(note1['dstTransactionHash']).not.toBe(undefined);
  expect(note2['dstTransactionHash']).not.toBe(undefined);
  expect(note3['status']).toBe(PrivateNoteStatus.SPENT);
  expect(withdraw.status).toBe(WithdrawStatus.SUCCEEDED);
  expect(eventPuller.isStarted()).toBe(false);
  expect(eventHandler.getEvents().length > 0).toBe(true);
  expect(eventPuller.errorMessage).toBe(undefined);
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
  expect(eventPuller.errorMessage).toBe(undefined);
});

test('test raise errors', async () => {
  providerPool.connect((rpcEndPoints) => {
    return new MockProvider(rpcEndPoints[0], true);
  });
  contractPool.connect((address, abi, provider) => new MockContract(address, abi, provider));
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
  expect(eventPuller.errorMessage).not.toBe(undefined);
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
  expect(eventPuller.errorMessage).toBe(undefined);
});
