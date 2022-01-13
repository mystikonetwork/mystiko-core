import { OffchainNote, PrivateNote, PrivateNoteStatus } from '../../src/model/note.js';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';

test('Test OffchainNote getters/setters', () => {
  const note = new OffchainNote();
  expect(note.chainId).toBe(undefined);
  expect(note.transactionHash).toBe(undefined);
  note.chainId = 1;
  expect(note.chainId).toBe(1);
  note.transactionHash = '0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad';
  expect(note.transactionHash).toBe('0d9d73e2d8cbd052f713e7aaff9d6ae78bb3139006c5e790d2089f9691b860ad');
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
  note.srcAmount = BigInt('0xdeadbeef');
  expect(note.srcAmount).toBe(BigInt('0xdeadbeef'));
  note.dstChainId = 2;
  expect(note.dstChainId).toBe(2);
  note.dstTransactionHash = '4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e';
  expect(note.dstTransactionHash).toBe('4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e');
  note.dstToken = 'USDT';
  expect(note.dstToken).toBe('USDT');
  note.dstTokenAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(note.dstTokenAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  note.dstAmount = BigInt('0xbaadf00d');
  expect(note.dstAmount).toBe(BigInt('0xbaadf00d'));
  note.encryptedOnchainNote = toBuff('deaddead');
  expect(toHexNoPrefix(note.encryptedOnchainNote)).toBe('deaddead');
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
