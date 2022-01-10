import { OnchainNote, OffchainNote, PrivateNote, PrivateNoteStatus } from '../../src/model/note.js';

test('Test OnchainNote getters/setters', () => {
  const note = new OnchainNote();
  expect(note.randomSecretP).toBe(undefined);
  expect(note.randomSecretR).toBe(undefined);
  expect(note.randomSecretS).toBe(undefined);
  expect(note.bytes).toBe(undefined);
  expect(note.getEncryptedNote('dddd')).toBe(undefined);
  expect(() => {
    note.randomSecretP = 'deadbeef';
  }).toThrow('invalid random secret p hex string');
  note.randomSecretP = '30c870c6973ad8ced8901e8b7f1c0bf6';
  expect(note.randomSecretP).toBe('30c870c6973ad8ced8901e8b7f1c0bf6');
  expect(() => {
    note.randomSecretR = 'deadbeef';
  }).toThrow('invalid random secret r hex string');
  note.randomSecretR = 'a687aa03e2b1bccd4891a4a475d214dc';
  expect(note.randomSecretR).toBe('a687aa03e2b1bccd4891a4a475d214dc');
  expect(() => {
    note.randomSecretS = 'deadbeef';
  }).toThrow('invalid random secret s hex string');
  note.randomSecretS = '941518a8339b602f702559775d434b3e';
  expect(note.randomSecretS).toBe('941518a8339b602f702559775d434b3e');
  expect(note.bytes.toString('hex')).toBe(
    '30c870c6973ad8ced8901e8b7f1c0bf6' +
      'a687aa03e2b1bccd4891a4a475d214dc' +
      '941518a8339b602f702559775d434b3e',
  );
});

test('Test OnchainNote encrypt/decrypt', () => {
  const note = new OnchainNote({
    randomSecretP: '30c870c6973ad8ced8901e8b7f1c0bf6',
    randomSecretR: 'a687aa03e2b1bccd4891a4a475d214dc',
    randomSecretS: '941518a8339b602f702559775d434b3e',
  });
  const encrypted = note.getEncryptedNote(
    '03942c5c01993c97f7d96d50d80e15f7f923bc9fc5ad11b03a0d339b497dabaa2a',
  );
  expect(() => {
    OnchainNote.decryptNote(
      '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242',
      Buffer.from(encrypted, 'hex'),
    );
  }).toThrow();
  expect(() => {
    OnchainNote.decryptNote(
      '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b241',
      Buffer.from(encrypted.replace('1', '2'), 'hex'),
    );
  }).toThrow();
  const decrypteNote = OnchainNote.decryptNote(
    '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b241',
    Buffer.from(encrypted, 'hex'),
  );
  expect(decrypteNote.randomSecretP).toBe(note.randomSecretP);
  expect(decrypteNote.randomSecretR).toBe(note.randomSecretR);
  expect(decrypteNote.randomSecretS).toBe(note.randomSecretS);
});

test('Test OffchainNote getters/setters', () => {
  const note = new OffchainNote();
  expect(note.chainId).toBe(undefined);
  expect(note.transactionHash).toBe(undefined);
  expect(note.bytes.toString()).toBe('{}');
  note.chainId = 1;
  expect(note.chainId).toBe(1);
  note.transactionHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(note.transactionHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
});

test('Test OffchainNote encrypt/decrypt', () => {
  const note = new OffchainNote({
    chainId: 1,
    transactionHash: '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad',
  });
  const encrypted = note.getEncryptedNote(
    '03942c5c01993c97f7d96d50d80e15f7f923bc9fc5ad11b03a0d339b497dabaa2a',
  );
  expect(() => {
    OnchainNote.decryptNote(
      '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b242',
      Buffer.from(encrypted, 'hex'),
    );
  }).toThrow();
  expect(() => {
    OnchainNote.decryptNote(
      '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b241',
      Buffer.from(encrypted.replace('1', '2'), 'hex'),
    );
  }).toThrow();
  const decryptedNote = OffchainNote.decryptNote(
    '2afed011a3e68d2f2885f4f41fbf917250a8985d18930535f2312173b6f3b241',
    Buffer.from(encrypted, 'hex'),
  );
  expect(decryptedNote.chainId).toBe(note.chainId);
  expect(decryptedNote.transactionHash).toBe(note.transactionHash);
});

test('Test PrivateNote getters/setters', () => {
  const note = new PrivateNote();
  expect(note.srcChainId).toBe(undefined);
  expect(note.srcTransactionHash).toBe(undefined);
  expect(note.srcToken).toBe(undefined);
  expect(note.srcTokenAddress).toBe(undefined);
  expect(note.srcAmount).toBe(undefined);
  expect(note.dstChainId).toBe(undefined);
  expect(note.dstTransactionHash).toBe(undefined);
  expect(note.dstToken).toBe(undefined);
  expect(note.dstTokenAddress).toBe(undefined);
  expect(note.dstAmount).toBe(undefined);
  expect(note.encryptedOnchainNote).toBe(undefined);
  expect(note.walletId).toBe(undefined);
  expect(note.shieldedAddress).toBe(undefined);
  expect(note.status).toBe(undefined);

  note.srcChainId = 1;
  expect(note.srcChainId).toBe(1);
  note.srcTransactionHash = '39739e36bb15becde05a21814eeebe17246e3003c8d5d903fb1b1be44eb2ff1a';
  expect(note.srcTransactionHash).toBe('39739e36bb15becde05a21814eeebe17246e3003c8d5d903fb1b1be44eb2ff1a');
  note.srcToken = 'USDT';
  expect(note.srcToken).toBe('USDT');
  note.srcTokenAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(note.srcTokenAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  note.srcAmount = 'deadbeef';
  expect(note.srcAmount).toBe('deadbeef');
  note.dstChainId = 2;
  expect(note.dstChainId).toBe(2);
  note.dstTransactionHash = '4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e';
  expect(note.dstTransactionHash).toBe('4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e');
  note.dstToken = 'USDT';
  expect(note.dstToken).toBe('USDT');
  note.dstTokenAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(note.dstTokenAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  note.dstAmount = 'baadf00d';
  expect(note.dstAmount).toBe('baadf00d');
  note.encryptedOnchainNote = 'deaddead';
  expect(note.encryptedOnchainNote).toBe('deaddead');
  note.walletId = 100;
  expect(note.walletId).toBe(100);
  note.shieldedAddress =
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6';
  expect(note.shieldedAddress).toBe(
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6',
  );
  expect(() => {
    note.status = 'unknown status';
  }).toThrow();
  note.status = PrivateNoteStatus.SPENDING;
  expect(note.status).toBe(PrivateNoteStatus.SPENDING);
});
