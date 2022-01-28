import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import BN from 'bn.js';
import { ProviderPool } from '../../src/chain/provider.js';
import { ContractPool } from '../../src/chain/contract.js';
import { readFromFile } from '../../src/config';
import { ContractHandler } from '../../src/handler/contractHandler.js';
import { createDatabase } from '../../src/database.js';
import { DepositHandler } from '../../src/handler/depositHandler.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { AccountHandler } from '../../src/handler/accountHandler.js';
import { NoteHandler } from '../../src/handler/noteHandler.js';
import { EventHandler } from '../../src/handler/eventHandler.js';
import { EventPuller } from '../../src/puller';
import { toFixedLenHex } from '../../src/utils.js';
import { DepositStatus } from '../../src/model';

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
            commitmentHash: toFixedLenHex('0xdeadbeef'),
            encryptedNote: toFixedLenHex(randomBytes(32)),
          },
        },
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            commitmentHash: toFixedLenHex('0xbaadbeef'),
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
            leaf: toFixedLenHex('0xdeadbeef'),
            leafIndex: Math.floor(Math.random() * 10),
          },
        },
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            amount: new BN(Math.floor(Math.random() * 1000)),
            leaf: toFixedLenHex('0xbaadbeef'),
            leafIndex: Math.floor(Math.random() * 10),
          },
        },
      ]);
    } else if (topic === 'Withdraw') {
      return Promise.resolve([
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
          args: {
            rootHash: new BN(Math.floor(Math.random() * 1000)),
            serialNumber: new BN(Math.floor(Math.random() * 1000)),
            recipient: toFixedLenHex(randomBytes(20), 20),
          },
        },
        {
          transactionHash: toFixedLenHex(randomBytes(32)),
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
});

test('test pulling behaviour', async () => {
  const deposit = db.deposits.insert({
    commitmentHash: new BN('deadbeef', 16).toString(),
    dstChainId: 1,
    status: DepositStatus.SRC_CONFIRMED,
    walletId: wallet.id,
  });
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    depositHandler,
    contractPool,
    eventHandler,
    isStoreEvent: true,
    pullIntervalMs: 1000,
  });
  const promise = eventPuller.start();
  expect(eventPuller.isStarted()).toBe(true);
  await promise;
  const sleepPromise = new Promise((resolve) => setTimeout(resolve, 2000));
  await sleepPromise;
  eventPuller.stop();
  expect(deposit['status']).toBe(DepositStatus.SUCCEEDED);
  expect(eventPuller.isStarted()).toBe(false);
  expect(eventHandler.getEvents().length > 0).toBe(true);
  expect(eventPuller.errorMessage).toBe(undefined);
});

test('test skip storing events', async () => {
  const eventPuller = new EventPuller({
    config,
    contractHandler,
    depositHandler,
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
    depositHandler,
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
