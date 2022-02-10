import { ethers } from 'ethers';
import { createDatabase } from '../../src/database.js';
import { readFromFile } from '../../src/config';
import { ProviderPool } from '../../src/chain/provider.js';
import { ContractPool } from '../../src/chain/contract.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { AccountHandler } from '../../src/handler/accountHandler.js';
import { NoteHandler } from '../../src/handler/noteHandler.js';
import { WithdrawHandler } from '../../src/handler/withdrawHandler.js';
import { BaseSigner } from '../../src/chain/signer.js';
import { toDecimals, toHex } from '../../src/utils.js';
import { MystikoABI } from '../../src/chain/abi.js';
import { WithdrawStatus, PrivateNoteStatus, ID_KEY } from '../../src/model';
import txReceipt02 from './files/txReceipt02.json';

class MockTransactionResponse {
  constructor(errorMessage = undefined) {
    this.errorMessage = errorMessage;
    this.hash = toHex(ethers.utils.randomBytes(32));
  }
  wait() {
    return new Promise((resolve, reject) => {
      if (!this.errorMessage) {
        resolve({ transactionHash: this.hash });
      } else {
        reject(this.errorMessage);
      }
    });
  }
}

class MockMystikoContract extends ethers.Contract {
  constructor(address, abi) {
    super(address, abi);
    this.withdrewSN = {};
  }

  connect(providerOrSigner) {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  async withdraw(proofA, proofB, proofC, rootHash, serialNumber, amount, recipientAddress) {
    expect(proofA instanceof Array && proofA.length === 2).toBe(true);
    expect(proofB instanceof Array && proofB.length === 2).toBe(true);
    expect(proofB[0] instanceof Array && proofB[0].length === 2).toBe(true);
    expect(proofB[1] instanceof Array && proofB[1].length === 2).toBe(true);
    expect(proofC instanceof Array && proofC.length === 2).toBe(true);
    expect(rootHash).not.toBe(undefined);
    expect(serialNumber).not.toBe(undefined);
    expect(amount).not.toBe(undefined);
    expect(ethers.utils.isAddress(recipientAddress)).toBe(true);
    if (this.withdrewSN[serialNumber]) {
      return await Promise.resolve(new MockTransactionResponse('double withdraw'));
    }
    this.withdrewSN[serialNumber] = true;
    return await Promise.resolve(new MockTransactionResponse());
  }

  queryFilter(eventName) {
    expect(eventName).toBe('MerkleTreeInsert');
    return Promise.resolve([
      {
        args: {
          leaf: '0x06e24ba159592dddda135365dad0b24529fe6aec153aa0b976bd27a004681c74',
          leafIndex: 0,
        },
      },
    ]);
  }
}

class MockSigner extends BaseSigner {
  constructor(conf, expectedChainId) {
    super(conf);
    this.expectedChainId = toHex(expectedChainId);
  }

  async connected() {
    return await Promise.resolve(true);
  }

  get signer() {
    return {};
  }

  async chainId() {
    return await Promise.resolve(this.expectedChainId);
  }
}

class MockProvider extends ethers.providers.Provider {
  constructor(txReceipt) {
    super();
    this.txReceipt = txReceipt;
  }

  async getTransactionReceipt() {
    return await Promise.resolve(this.txReceipt);
  }
}

let db;
let conf;
let providerPool;
let contractPool;
let contract;
let walletHandler;
let accountHandler;
let noteHandler;
let withdrawHandler;
let privateNote;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/files/config.test.json');
  providerPool = new ProviderPool(conf);
  providerPool.connect(() => new MockProvider(txReceipt02));
  contractPool = new ContractPool(conf, providerPool);
  contract = new MockMystikoContract(
    '0x98ed94360cad67a76a53d8aa15905e52485b73d1',
    MystikoABI.MystikoWithLoopERC20.abi,
  );
  contractPool.connect(() => contract);
  walletHandler = new WalletHandler(db, conf);
  accountHandler = new AccountHandler(walletHandler, db, conf);
  noteHandler = new NoteHandler(walletHandler, accountHandler, providerPool, db, conf);
  withdrawHandler = new WithdrawHandler(
    walletHandler,
    accountHandler,
    noteHandler,
    providerPool,
    contractPool,
    db,
    conf,
  );
  await walletHandler.createWallet(walletMasterSeed, walletPassword);
  await accountHandler.importAccountFromSecretKey(
    walletPassword,
    'account 1',
    '038e95e5d94292956a3476342c16346b4b7033fa7f6827560dab890cb6eca1' +
      'ab0aa2663250e332cbca03ff300dae0220ba029af87a2f1f166d29e9c4d102d87c',
  );
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a"}';
  privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
});

afterEach(() => {
  db.database.close();
});

test('test withdraw basic', async () => {
  const signer = new MockSigner(conf, 56);
  let cbCount = 0;
  const cb = (deposit, oldStatus, newStatus) => {
    expect(deposit.status).toBe(newStatus);
    expect(oldStatus).not.toBe(newStatus);
    cbCount++;
  };
  const request = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  let { withdraw, withdrawPromise } = await withdrawHandler.createWithdraw(
    walletPassword,
    request,
    signer,
    cb,
  );
  await withdrawPromise;
  withdraw = withdrawHandler.getWithdraw(withdraw);
  privateNote = noteHandler.getPrivateNote(privateNote);
  expect(withdraw.errorMessage).toBe(undefined);
  expect(cbCount).toBe(4);
  expect(withdraw.chainId).toBe(56);
  expect(withdraw.asset).toBe('USDT');
  expect(withdraw.assetAddress).toBe('0x3162b6ce79df04608db04a8d609f83521c3cf9ae');
  expect(withdraw.assetDecimals).toBe(18);
  expect(withdraw.amount.toString()).toBe(toDecimals(100, 18).toString());
  expect(withdraw.recipientAddress).toBe('0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065');
  expect(withdraw.walletId).toBe(1);
  expect(withdraw.privateNoteId).toBe(privateNote.id);
  expect(withdraw.status).toBe(WithdrawStatus.SUCCEEDED);
  expect(privateNote.withdrawTransactionHash).toBe(withdraw.transactionHash);
  expect(privateNote.status).toBe(PrivateNoteStatus.SPENT);
  await expect(withdrawHandler.createWithdraw(walletPassword, request, signer, cb)).rejects.toThrow();
  await noteHandler.updateStatus(privateNote, PrivateNoteStatus.IMPORTED);
  const ret = await withdrawHandler.createWithdraw(walletPassword, request, signer, cb);
  await ret.withdrawPromise;
  withdraw = withdrawHandler.getWithdraw(ret.withdraw);
  expect(withdraw.errorMessage).not.toBe(undefined);
  expect(withdraw.status).toBe(WithdrawStatus.FAILED);
});

test('test getWithdraw/getWithdraws', async () => {
  const signer = new MockSigner(conf, 56);
  const request = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  const ret = await withdrawHandler.createWithdraw(walletPassword, request, signer);
  await ret.withdrawPromise;
  expect(withdrawHandler.getWithdraw(1).transactionHash).not.toBe(undefined);
  expect(withdrawHandler.getWithdraw(withdrawHandler.getWithdraw(1).transactionHash).id).toBe(1);
  expect(withdrawHandler.getWithdraw(withdrawHandler.getWithdraw(1).serialNumber.toString()).id).toBe(1);
  expect(withdrawHandler.getWithdraw(withdrawHandler.getWithdraw(1)).id).toBe(1);
  expect(
    withdrawHandler.getWithdraws({
      filterFunc: (w) => w.chainId === 1,
    }).length,
  ).toBe(0);
  expect(
    withdrawHandler.getWithdraws({
      filterFunc: (w) => w.chainId === 56,
      sortBy: 'id',
      desc: true,
      offset: 1,
      limit: 10,
    }).length,
  ).toBe(0);
  expect(
    withdrawHandler.getWithdraws({
      sortBy: 'id',
      desc: true,
      offset: 0,
      limit: 10,
    }).length,
  ).toBe(1);
});
