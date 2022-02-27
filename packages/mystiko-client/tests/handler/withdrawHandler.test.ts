// eslint-disable-next-line max-classes-per-file
import BN from 'bn.js';
import { ethers } from 'ethers';
import { MystikoABI, MystikoConfig, readFromFile } from '@mystiko/config';
import { toDecimals, toHex, toBN } from '@mystiko/utils';
import {
  createDatabase,
  ProviderPool,
  ContractPool,
  MystikoContract,
  WalletHandler,
  AccountHandler,
  ContractHandler,
  NoteHandler,
  WithdrawHandler,
  BaseSigner,
  PrivateNoteStatus,
  MystikoDatabase,
  PrivateNote,
  Withdraw,
  WithdrawStatus,
} from '../../src';
import txReceipt02 from './files/txReceipt02.json';

class MockTransactionResponse {
  public readonly errorMessage?: string;

  public readonly hash: string;

  constructor(errorMessage?: string) {
    this.errorMessage = errorMessage;
    this.hash = toHex(ethers.utils.randomBytes(32));
  }

  public wait() {
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
  private readonly withdrewSN: { [key: string]: boolean };

  constructor(address: string, abi: any) {
    super(address, abi);
    this.withdrewSN = {};
  }

  public connect(providerOrSigner: ethers.Signer | ethers.providers.Provider | string): ethers.Contract {
    expect(providerOrSigner).not.toBe(undefined);
    return this;
  }

  public withdraw(
    proofA: string[],
    proofB: string[][],
    proofC: string[],
    rootHash: string,
    serialNumber: string,
    amount: string,
    recipientAddress: string,
  ) {
    expect(proofA.length === 2).toBe(true);
    expect(proofB.length === 2).toBe(true);
    expect(proofB[0].length === 2).toBe(true);
    expect(proofB[1].length === 2).toBe(true);
    expect(proofC.length === 2).toBe(true);
    expect(rootHash).not.toBe(undefined);
    expect(serialNumber).not.toBe(undefined);
    expect(amount).not.toBe(undefined);
    expect(ethers.utils.isAddress(recipientAddress)).toBe(true);
    if (this.withdrewSN[serialNumber]) {
      return Promise.resolve(new MockTransactionResponse('double withdraw'));
    }
    this.withdrewSN[serialNumber] = true;
    return Promise.resolve(new MockTransactionResponse());
  }

  // eslint-disable-next-line class-methods-use-this
  queryFilter(event: ethers.EventFilter): Promise<ethers.Event[]> {
    expect(event.topics).toStrictEqual(['MerkleTreeInsert']);
    const events = [
      {
        args: {
          leaf: '0x1b0b865b6fd5405112f51d8889556d825f77413a5d97b498406408d8e83f1b5b',
          leafIndex: 0,
        },
      },
    ];
    return Promise.resolve(events.map(MockMystikoContract.convertToEthersEvent));
  }

  static convertToEthersEvent(object: any) {
    return object as ethers.Event;
  }
}

class MockSigner extends BaseSigner {
  private readonly expectedChainId: string;

  private readonly wallet: ethers.Wallet;

  constructor(conf: MystikoConfig, expectedChainId: number) {
    super(conf);
    this.expectedChainId = toHex(expectedChainId);
    this.wallet = ethers.Wallet.createRandom();
  }

  // eslint-disable-next-line class-methods-use-this
  public connected() {
    return Promise.resolve(true);
  }

  // eslint-disable-next-line class-methods-use-this
  public get signer() {
    return this.wallet;
  }

  public chainId() {
    return Promise.resolve(this.expectedChainId);
  }
}

class MockProvider extends ethers.providers.JsonRpcProvider {
  private readonly txReceipt: ethers.providers.TransactionReceipt;

  constructor(txReceipt: ethers.providers.TransactionReceipt) {
    super();
    this.txReceipt = txReceipt;
  }

  public getTransactionReceipt() {
    return Promise.resolve(this.txReceipt);
  }
}

class MockWrappedContract extends MystikoContract {
  private readonly balance: BN;

  constructor(contract: ethers.Contract, balance: BN) {
    super(contract);
    this.balance = balance;
  }

  assetBalance() {
    return Promise.resolve(this.balance);
  }
}

async function expectErrorMessage(
  withdrawRet: Promise<{ withdraw: Withdraw; withdrawPromise: Promise<Withdraw> }>,
) {
  const ret = await withdrawRet;
  const withdraw = await ret.withdrawPromise;
  expect(withdraw.errorMessage).not.toBe(undefined);
}

let db: MystikoDatabase;
let conf: MystikoConfig;
let providerPool: ProviderPool;
let contractPool: ContractPool;
let contract: ethers.Contract;
let walletHandler: WalletHandler;
let accountHandler: AccountHandler;
let contractHandler: ContractHandler;
let noteHandler: NoteHandler;
let withdrawHandler: WithdrawHandler;
let privateNote: PrivateNote;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/config.test.json');
  providerPool = new ProviderPool(conf);
  // @ts-ignore
  providerPool.connect(() => new MockProvider(txReceipt02));
  contractHandler = new ContractHandler(db, conf);
  await contractHandler.importFromConfig();
  contractPool = new ContractPool(conf, providerPool);
  contract = new MockMystikoContract(
    '0x98ed94360cad67a76a53d8aa15905e52485b73d1',
    MystikoABI.MystikoWithLoopERC20.abi,
  );
  contractPool.connect(contractHandler.getContracts(), () => contract);
  contractPool.updateWrappedContract(
    56,
    '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    new MockWrappedContract(contract, toBN('100000000000000000000')),
  );
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
  withdrawHandler = new WithdrawHandler(
    walletHandler,
    accountHandler,
    contractHandler,
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
  const cb = (withdraw: Withdraw, oldStatus: WithdrawStatus, newStatus: WithdrawStatus) => {
    expect(withdraw.status).toBe(newStatus);
    expect(oldStatus).not.toBe(newStatus);
    cbCount += 1;
  };
  const request = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  await expect(withdrawHandler.createWithdraw('wrong password', request, signer, cb)).rejects.toThrow();
  const { withdraw, withdrawPromise } = await withdrawHandler.createWithdraw(
    walletPassword,
    request,
    signer,
    cb,
  );
  await withdrawPromise;
  const withdraw1 = withdrawHandler.getWithdraw(withdraw || -1);
  privateNote = noteHandler.getPrivateNote(privateNote || -1) || new PrivateNote();
  expect(withdraw1?.errorMessage).toBe(undefined);
  expect(cbCount).toBe(4);
  expect(withdraw1?.chainId).toBe(56);
  expect(withdraw1?.asset).toBe('USDT');
  expect(withdraw1?.assetAddress).toBe('0x3162b6ce79df04608db04a8d609f83521c3cf9ae');
  expect(withdraw1?.assetDecimals).toBe(18);
  expect(withdraw1?.amount?.toString()).toBe(toDecimals(100, 18).toString());
  expect(withdraw1?.recipientAddress).toBe('0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065');
  expect(withdraw1?.walletId).toBe(1);
  expect(withdraw1?.privateNoteId).toBe(privateNote?.id);
  expect(withdraw1?.status).toBe(WithdrawStatus.SUCCEEDED);
  expect(privateNote?.withdrawTransactionHash).toBe(withdraw1?.transactionHash);
  expect(privateNote?.status).toBe(PrivateNoteStatus.SPENT);
  await expect(withdrawHandler.createWithdraw(walletPassword, request, signer, cb)).rejects.toThrow();
  await noteHandler.updateStatus(privateNote || -1, PrivateNoteStatus.IMPORTED);
  const ret = await withdrawHandler.createWithdraw(walletPassword, request, signer, cb);
  await ret.withdrawPromise;
  const withdraw2 = withdrawHandler.getWithdraw(ret.withdraw);
  expect(withdraw2?.errorMessage).not.toBe(undefined);
  expect(withdraw2?.status).toBe(WithdrawStatus.FAILED);
});

test('test withdraw errors', async () => {
  const signer = new MockSigner(conf, 56);
  const request1 = { privateNote: 111, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  await expect(withdrawHandler.createWithdraw(walletPassword, request1, signer)).rejects.toThrow();
  const request2 = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  db.notes.update({ ...privateNote.data, dstChainId: undefined });
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
  db.notes.update({ ...privateNote.data, shieldedAddress: undefined });
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
  db.notes.update({ ...privateNote.data, dstProtocolAddress: undefined });
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
  db.notes.update({
    ...privateNote.data,
    shieldedAddress:
      'HmWq2wPvHeaAw87mcTSdxdN1RWgFpDWdcaHiRqg4mEEu3pFYvuHdrMMdHrV5PMYVmLyQjZU53NZViqxxQee4aaGVZ',
  });
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
  db.notes.update({ ...privateNote.data, amount: undefined });
  await expectErrorMessage(withdrawHandler.createWithdraw(walletPassword, request2, signer));
  db.notes.update({ ...privateNote.data, commitmentHash: undefined });
  await expectErrorMessage(withdrawHandler.createWithdraw(walletPassword, request2, signer));
  db.notes.update({ ...privateNote.data, encryptedOnChainNote: undefined });
  await expectErrorMessage(withdrawHandler.createWithdraw(walletPassword, request2, signer));
  db.notes.update(privateNote.data);
  db.contracts.clear();
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
  await contractHandler.importFromConfig();
  const newContract = contractHandler.getContract(
    privateNote.dstChainId || 1,
    privateNote.dstProtocolAddress || '',
  );
  db.contracts.update({ ...newContract?.data, address: '0x66e166a887bdb0bcc58c5e52b286ea27d52854f5' });
  db.notes.update({ ...privateNote.data, dstProtocolAddress: '0x66e166a887bdb0bcc58c5e52b286ea27d52854f5' });
  await expect(withdrawHandler.createWithdraw(walletPassword, request2, signer)).rejects.toThrow();
});

test('test insufficient pool balance', async () => {
  contractPool.updateWrappedContract(
    56,
    '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67',
    new MockWrappedContract(contract, toBN('0')),
  );
  const signer = new MockSigner(conf, 56);
  const request = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  const { withdraw, withdrawPromise } = await withdrawHandler.createWithdraw(walletPassword, request, signer);
  await withdrawPromise;
  const withdraw1 = withdrawHandler.getWithdraw(withdraw || -1);
  expect(withdraw1?.errorMessage).not.toBe(undefined);
  expect(withdraw1?.status).toBe(WithdrawStatus.FAILED);
});

test('test getWithdraw/getWithdraws', async () => {
  const signer = new MockSigner(conf, 56);
  const request = { privateNote, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' };
  const ret = await withdrawHandler.createWithdraw(walletPassword, request, signer);
  await ret.withdrawPromise;
  const withdraw = withdrawHandler.getWithdraw(1);
  expect(withdraw?.transactionHash).not.toBe(undefined);
  expect(withdrawHandler.getWithdraw(withdraw?.transactionHash || -1)?.id).toBe(1);
  expect(withdrawHandler.getWithdraw(withdraw?.serialNumber?.toString() || -1)?.id).toBe(1);
  expect(withdrawHandler.getWithdraw(withdraw || -1)?.id).toBe(1);
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
