// eslint-disable-next-line max-classes-per-file
import BN from 'bn.js';
import { ethers } from 'ethers';
import { BridgeType, MystikoConfig, readFromFile } from '@mystiko/config';
import { toDecimals, toHexNoPrefix } from '@mystiko/utils';
import {
  AccountHandler,
  Contract,
  ContractHandler,
  ContractPool,
  createDatabase,
  DepositReceipt,
  MystikoContract,
  MystikoDatabase,
  NoteHandler,
  PrivateNoteStatus,
  ProviderPool,
  WalletHandler,
} from '../../src';
import txReceipt01 from './files/txReceipt01.json';
import txReceipt02 from './files/txReceipt02.json';

class MockProvider extends ethers.providers.JsonRpcProvider {
  private readonly txReceipt: any;

  constructor(txReceipt: any) {
    super();
    this.txReceipt = txReceipt;
  }

  public getTransactionReceipt(): Promise<any> {
    return Promise.resolve(this.txReceipt);
  }
}

class MockWrappedContract extends MystikoContract {
  private readonly balance: BN;

  constructor(contract: Contract, balance: BN) {
    super(contract);
    this.balance = balance;
  }

  public assetBalance(): Promise<BN> {
    return Promise.resolve(this.balance);
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
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/config.test.json');
  const emptyConf = await readFromFile('tests/config/config2.test.json');
  contractHandler = new ContractHandler(db, conf);
  await contractHandler.importFromConfig();
  providerPool = new ProviderPool(conf);
  providerPool.connect();
  contractPool = new ContractPool(conf, providerPool);
  await contractPool.connect(contractHandler.getContracts());
  walletHandler = new WalletHandler(db, conf);
  accountHandler = new AccountHandler(walletHandler, db, conf);
  noteHandler = new NoteHandler(
    walletHandler,
    accountHandler,
    contractHandler,
    providerPool,
    contractPool,
    db,
    emptyConf,
  );
  await walletHandler.createWallet(walletMasterSeed, walletPassword);
  await accountHandler.importAccountFromSecretKey(
    walletPassword,
    'account 1',
    '038e95e5d94292956a3476342c16346b4b7033fa7f6827560dab890cb6eca1' +
      'ab0aa2663250e332cbca03ff300dae0220ba029af87a2f1f166d29e9c4d102d87c',
  );
});

afterEach(() => {
  db.database.close();
});

test('test importFromOffChainNote basic', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  const wrongNote =
    '{"transactionHash":"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  await expect(noteHandler.importFromOffChainNote('wrong password', note)).rejects.toThrow();
  await expect(noteHandler.importFromOffChainNote(walletPassword, wrongNote)).rejects.toThrow();
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
  expect(privateNote.srcChainId).toBe(1);
  expect(privateNote.srcTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(privateNote.srcAsset).toBe('USDT');
  expect(privateNote.srcAssetAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(privateNote.srcAssetDecimals).toBe(18);
  expect(privateNote.srcProtocolAddress).toBe('0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  expect(privateNote.amount?.toString()).toBe(toDecimals(100, 18).toString());
  expect(privateNote.bridge).toBe(BridgeType.LOOP);
  expect(privateNote.dstChainId).toBe(1);
  expect(privateNote.dstTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(privateNote.dstAsset).toBe('USDT');
  expect(privateNote.dstAssetAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(privateNote.dstAssetDecimals).toBe(18);
  expect(privateNote.dstProtocolAddress).toBe('0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  expect(privateNote.commitmentHash?.toString()).toBe(
    '6817961672086967550842806257390624158626823691800905067457884646190248540286',
  );
  expect(privateNote.shieldedAddress).toBe(
    'D99nnxTZjyemugqq4196QSKTKrLzf7iQZLReZzNsCDuFmAVW5KFXC6wuPHU8K2RgABa1KHHY3jNTMrTWhahcQccRd',
  );
  expect(toHexNoPrefix(privateNote.encryptedOnChainNote || '')).toBe(
    '5424cb2bd140460a6f9623b036e905da046621ef69ae54fa59963384ade754295943e391ddf9bfbec50d' +
      '757c0d5a741080a905690b79f2e780bd0e3d3d8f730f54392f2e411fd22de64118502581' +
      'a54c6810aa87de6c159230aa6dce350e5ed0d2d8a2851bfee590ef29cb8dfc5493e16ad3' +
      '4c8488fd08276a41a7acf93743f7249d49e2087625d870e38e1a92fd72bce751d6ff85b7' +
      'efd9c77c926fa548b3f143f48608b36d43689699b7700223588f76',
  );
  expect(privateNote?.walletId).toBe(1);
  expect(privateNote?.status).toBe(PrivateNoteStatus.IMPORTED);
});

test('test importFromOffChainNote duplicate', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a"}';
  const offChainNote = new DepositReceipt(JSON.parse(note));
  providerPool.connect(() => new MockProvider(txReceipt02));
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, offChainNote);
  expect(privateNote.dstChainId).toBe(56);
  expect(privateNote.dstAsset).toBe('USDT');
  expect(privateNote.dstAssetAddress).toBe('0x3162b6ce79df04608db04a8d609f83521c3cf9ae');
  expect(privateNote.dstAssetDecimals).toBe(18);
  expect(privateNote.dstProtocolAddress).toBe('0x961f315a836542e603a3df2e0dd9d4ecd06ebc67');
  await expect(noteHandler.importFromOffChainNote(walletPassword, offChainNote)).rejects.toThrow();
});

test('test importFromOffChainNote no authority', async () => {
  await accountHandler.removeAccount(walletPassword, 1);
  await accountHandler.addAccount(walletPassword, 'account 2');
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  await expect(noteHandler.importFromOffChainNote(walletPassword, note)).rejects.toThrow();
});

test('test getPrivateNote/getPrivateNotes', async () => {
  const note1 =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  const note2 =
    '{"chainId":1,"transactionHash":' +
    '"0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  await noteHandler.importFromOffChainNote(walletPassword, note1);
  providerPool.connect(() => new MockProvider(txReceipt02));
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note2);
  expect(noteHandler.getPrivateNote(1)?.srcTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(
    noteHandler.getPrivateNote('0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac')?.id,
  ).toBe(1);
  expect(
    noteHandler.getPrivateNote(
      '12232809528603762205793017360014872637926529781479826020712155160173816519515',
    )?.id,
  ).toBe(2);
  expect(
    noteHandler.getPrivateNote(
      'dca06f25ee10d9ee777aa71ae5620c36041be9b53e03224f467fe9c6d1bceba8e' +
        '86fa9e687149dca4c2b7f6ae4d1f041e7d372f4357e7a0f490900683afb6d0453d748a923a4a925137e' +
        'eb6babc39055206052a4dacb472994a37479f266667bfe753225e557b581403eefb436d1cf8e628cf1f' +
        '8c60fb1c5af7d375029c986748b68c2e06f96196fe9ada95439992666aa73626b29f80f5ec0cabd2439' +
        '873b64fc4a3b648b7edb0adf185cc0f9f91e1578',
    )?.id,
  ).toBe(2);
  expect(noteHandler.getPrivateNote(privateNote || -1)?.id).toBe(privateNote?.id);
  expect(noteHandler.getPrivateNote(10001)).toBe(undefined);
  expect(
    noteHandler.getPrivateNotes({
      filterFunc: (pn) => pn.bridge === BridgeType.POLY,
    })[0].id,
  ).toBe(2);
  expect(
    noteHandler.getPrivateNotes({
      offset: 1,
      limit: 2,
      sortBy: 'id',
      desc: true,
    })[0].id,
  ).toBe(1);
});

test('test updateStatus', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
  expect(privateNote.status).toBe(PrivateNoteStatus.IMPORTED);
  await noteHandler.updateStatus(1, PrivateNoteStatus.SPENT);
  expect(noteHandler.getPrivateNote(1)?.status).toBe(PrivateNoteStatus.SPENT);
  await expect(noteHandler.updateStatus(213234, PrivateNoteStatus.IMPORTED)).rejects.toThrow();
});

test('test groupBy', () => {
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenA',
    amount: '1000000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.IMPORTED,
  });
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenA',
    amount: '1000000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.SPENT,
  });
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenA',
    amount: '3000000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.IMPORTED,
  });
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenB',
    amount: '8100000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.SPENT,
  });
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenC',
    amount: '4000000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.IMPORTED,
  });
  db.notes.insert({
    walletId: 1,
    dstAsset: 'TokenC',
    amount: '5300000000000000000',
    dstAssetDecimals: 18,
    status: PrivateNoteStatus.IMPORTED,
  });
  let groups = noteHandler.groupPrivateNoteByDstAsset();
  expect(groups).toStrictEqual([
    { dstAsset: 'TokenA', count: 2, total: 5, unspent: 4 },
    { dstAsset: 'TokenB', count: 0, total: 8.1, unspent: 0 },
    { dstAsset: 'TokenC', count: 2, total: 9.3, unspent: 9.3 },
  ]);
  groups = noteHandler.groupPrivateNoteByDstAsset({ filterFunc: (note) => note.dstAsset !== 'TokenB' });
  expect(groups).toStrictEqual([
    { dstAsset: 'TokenA', count: 2, total: 5, unspent: 4 },
    { dstAsset: 'TokenC', count: 2, total: 9.3, unspent: 9.3 },
  ]);
});

test('test getPoolBalance', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  const contractConfig = contractHandler.getContract(1, '0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  expect(contractConfig).not.toBe(undefined);
  if (contractConfig) {
    contractConfig.assetDecimals = 17;
    db.contracts.update(contractConfig.data);
    contractPool.updateWrappedContract(
      1,
      '0x98ed94360cad67a76a53d8aa15905e52485b73d1',
      new MockWrappedContract(contractConfig, toDecimals(1234, 17)),
    );
    const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
    const balance = await noteHandler.getPoolBalance(privateNote);
    expect(balance).toBe(1234);
  }
  expect(await noteHandler.getPoolBalance(123444)).toBe(undefined);
});

test('test updateTransactionHash', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac"}';
  providerPool.connect(() => new MockProvider(txReceipt01));
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
  await noteHandler.updateWithdrawTransactionHash(
    privateNote,
    '0xa5fe3b73022a3c5eb8f887fff983671446aa5d85a3659c6ead32d0dd6a92747c',
  );
  const newPrivateNote = noteHandler.getPrivateNote(privateNote);
  expect(newPrivateNote?.withdrawTransactionHash).toBe(
    '0xa5fe3b73022a3c5eb8f887fff983671446aa5d85a3659c6ead32d0dd6a92747c',
  );
  await expect(noteHandler.updateWithdrawTransactionHash(12334234, '')).rejects.toThrow();
});

test('test createPrivateNoteFromTxReceipt', async () => {
  providerPool.connect(() => new MockProvider(txReceipt01));
  db.contracts.clear();
  await expect(
    // @ts-ignore
    noteHandler.createPrivateNoteFromTxReceipt(1, txReceipt01, true, walletPassword),
  ).rejects.toThrow();
  await contractHandler.importFromConfig();
  await expect(
    // @ts-ignore
    noteHandler.createPrivateNoteFromTxReceipt(1, txReceipt01, true),
  ).rejects.toThrow();
  const contract = contractHandler.getContract(1, '0x8fb1df17768e29c936edfbce1207ad13696268b7');
  if (contract) {
    db.contracts.update({ ...contract.data, peerChainId: undefined });
    await expect(
      // @ts-ignore
      noteHandler.createPrivateNoteFromTxReceipt(1, txReceipt02, true, walletPassword),
    ).rejects.toThrow();
    db.contracts.update({ ...contract.data, peerContractAddress: undefined });
    await expect(
      // @ts-ignore
      noteHandler.createPrivateNoteFromTxReceipt(1, txReceipt02, true, walletPassword),
    ).rejects.toThrow();
    db.contracts.update({ ...contract.data, peerChainId: 23234 });
    await expect(
      // @ts-ignore
      noteHandler.createPrivateNoteFromTxReceipt(1, txReceipt02, true, walletPassword),
    ).rejects.toThrow();
  }
  const shieldAddress = accountHandler.getAccount(1)?.shieldedAddress;
  const privateNote = await noteHandler.createPrivateNoteFromTxReceipt(
    1,
    // @ts-ignore
    txReceipt01,
    false,
    undefined,
    shieldAddress,
  );
  expect(privateNote).not.toBe(undefined);
});
