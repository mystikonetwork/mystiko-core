import { ethers } from 'ethers';
import { NoteHandler } from '../../src/handler/noteHandler.js';
import { createDatabase } from '../../src/database.js';
import { readFromFile } from '../../src/config';
import { ProviderPool } from '../../src/chain/provider.js';
import { WalletHandler } from '../../src/handler/walletHandler.js';
import { AccountHandler } from '../../src/handler/accountHandler.js';
import { toDecimals, toHexNoPrefix } from '../../src/utils.js';
import { OffChainNote, ID_KEY, PrivateNoteStatus, BridgeType } from '../../src/model';
import txReceipt01 from './files/txReceipt01.json';
import txReceipt02 from './files/txReceipt02.json';

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
let walletHandler;
let accountHandler;
let noteHandler;
const walletMasterSeed = 'awesomeMasterSeed';
const walletPassword = 'P@ssw0rd';

beforeEach(async () => {
  db = await createDatabase('test.db');
  conf = await readFromFile('tests/config/files/config.test.json');
  providerPool = new ProviderPool(conf);
  walletHandler = new WalletHandler(db, conf);
  accountHandler = new AccountHandler(walletHandler, db, conf);
  noteHandler = new NoteHandler(walletHandler, accountHandler, providerPool, db, conf);
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
  providerPool.connect(() => new MockProvider(txReceipt01));
  const privateNote = await noteHandler.importFromOffChainNote(walletPassword, note);
  expect(privateNote.srcChainId).toBe(1);
  expect(privateNote.srcTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(privateNote.srcAsset).toBe('USDT');
  expect(privateNote.srcAssetAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(privateNote.srcAssetDecimals).toBe(18);
  expect(privateNote.srcProtocolAddress).toBe('0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  expect(privateNote.amount.toString()).toBe(toDecimals(100, 18).toString());
  expect(privateNote.bridge).toBe(BridgeType.LOOP);
  expect(privateNote.dstChainId).toBe(1);
  expect(privateNote.dstTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(privateNote.dstAsset).toBe('USDT');
  expect(privateNote.dstAssetAddress).toBe('0x26fc224b37952bd12c792425f242e0b0a55453a6');
  expect(privateNote.dstAssetDecimals).toBe(18);
  expect(privateNote.dstProtocolAddress).toBe('0x98ed94360cad67a76a53d8aa15905e52485b73d1');
  expect(privateNote.commitmentHash.toString()).toBe(
    '6817961672086967550842806257390624158626823691800905067457884646190248540286',
  );
  expect(privateNote.shieldedAddress).toBe(
    'D99nnxTZjyemugqq4196QSKTKrLzf7iQZLReZzNsCDuFmAVW5KFXC6wuPHU8K2RgABa1KHHY3jNTMrTWhahcQccRd',
  );
  expect(toHexNoPrefix(privateNote.encryptedOnChainNote)).toBe(
    '5424cb2bd140460a6f9623b036e905da046621ef69ae54fa59963384ade754295943e391ddf9bfbec50d' +
      '757c0d5a741080a905690b79f2e780bd0e3d3d8f730f54392f2e411fd22de64118502581' +
      'a54c6810aa87de6c159230aa6dce350e5ed0d2d8a2851bfee590ef29cb8dfc5493e16ad3' +
      '4c8488fd08276a41a7acf93743f7249d49e2087625d870e38e1a92fd72bce751d6ff85b7' +
      'efd9c77c926fa548b3f143f48608b36d43689699b7700223588f76',
  );
  expect(privateNote.walletId).toBe(1);
  expect(privateNote.status).toBe(PrivateNoteStatus.IMPORTED);
});

test('test importFromOffChainNote duplicate', async () => {
  const note =
    '{"chainId":1,"transactionHash":' +
    '"0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a"}';
  const offChainNote = new OffChainNote(JSON.parse(note));
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
  expect(noteHandler.getPrivateNote(1).srcTransactionHash).toBe(
    '0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac',
  );
  expect(
    noteHandler.getPrivateNote('0x869b67d770d52eb17b67ce3328ba305d2cee10d5bb004e4e0f095f2803fdfaac').id,
  ).toBe(1);
  expect(
    noteHandler.getPrivateNote(
      '3113706509076416031963491857802290967' + '102391936273444990333872498785028414580',
    ).id,
  ).toBe(2);
  expect(
    noteHandler.getPrivateNote(
      'dca06f25ee10d9ee777aa71ae5620c36041be9b53e03224f467fe9c6d1bceba8e' +
        '86fa9e687149dca4c2b7f6ae4d1f041e7d372f4357e7a0f490900683afb6d0453d748a923a4a925137e' +
        'eb6babc39055206052a4dacb472994a37479f266667bfe753225e557b581403eefb436d1cf8e628cf1f' +
        '8c60fb1c5af7d375029c986748b68c2e06f96196fe9ada95439992666aa73626b29f80f5ec0cabd2439' +
        '873b64fc4a3b648b7edb0adf185cc0f9f91e1578',
    ).id,
  ).toBe(2);
  expect(noteHandler.getPrivateNote(privateNote)).toBe(privateNote);
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
      sortBy: ID_KEY,
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
  expect(noteHandler.getPrivateNote(1).status).toBe(PrivateNoteStatus.SPENT);
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
    { dstAsset: 'TokenA', count: 3, total: 5, unspent: 4 },
    { dstAsset: 'TokenB', count: 1, total: 8.1, unspent: 0 },
    { dstAsset: 'TokenC', count: 2, total: 9.3, unspent: 9.3 },
  ]);
  groups = noteHandler.groupPrivateNoteByDstAsset({ filterFunc: (note) => note.dstAsset !== 'TokenB' });
  expect(groups).toStrictEqual([
    { dstAsset: 'TokenA', count: 3, total: 5, unspent: 4 },
    { dstAsset: 'TokenC', count: 2, total: 9.3, unspent: 9.3 },
  ]);
});
