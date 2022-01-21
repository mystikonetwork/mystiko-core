import BN from 'bn.js';
import { OffChainNote, PrivateNote, PrivateNoteStatus } from '../../src/model/note.js';
import { toBuff, toHexNoPrefix } from '../../src/utils.js';
import { BridgeType } from '../../src/config/contractConfig.js';

test('Test OffChainNote getters/setters', () => {
  const note = new OffChainNote();
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
  expect(note.srcProtocolAddress).toBe(undefined);
  expect(note.amount).toBe(undefined);
  expect(note.bridge).toBe(undefined);
  expect(note.dstChainId).toBe(undefined);
  expect(note.dstTransactionHash).toBe(undefined);
  expect(note.dstToken).toBe(undefined);
  expect(note.dstTokenAddress).toBe(undefined);
  expect(note.dstProtocolAddress).toBe(undefined);
  expect(note.commitmentHash).toBe(undefined);
  expect(note.encryptedOnChainNote).toBe(undefined);
  expect(note.walletId).toBe(undefined);
  expect(note.shieldedAddress).toBe(undefined);
  expect(note.withdrawTransactionHash).toBe(undefined);
  expect(note.status).toBe(undefined);

  note.srcChainId = 1;
  expect(note.srcChainId).toBe(1);
  note.srcTransactionHash = '39739e36bb15becde05a21814eeebe17246e3003c8d5d903fb1b1be44eb2ff1a';
  expect(note.srcTransactionHash).toBe('39739e36bb15becde05a21814eeebe17246e3003c8d5d903fb1b1be44eb2ff1a');
  note.srcToken = 'USDT';
  expect(note.srcToken).toBe('USDT');
  note.srcTokenAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(note.srcTokenAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  note.srcProtocolAddress = '81b7e08f65bdf5648606c89998a9cc8164397647';
  expect(note.srcProtocolAddress).toBe('81b7e08f65bdf5648606c89998a9cc8164397647');
  note.amount = new BN('deadbeef', 16);
  expect(toHexNoPrefix(note.amount)).toBe('deadbeef');
  expect(() => {
    note.bridge = 'wrong type';
  }).toThrow();
  note.bridge = BridgeType.LOOP;
  expect(note.bridge).toBe(BridgeType.LOOP);
  note.dstChainId = 2;
  expect(note.dstChainId).toBe(2);
  note.dstTransactionHash = '4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e';
  expect(note.dstTransactionHash).toBe('4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e');
  note.dstToken = 'USDT';
  expect(note.dstToken).toBe('USDT');
  note.dstTokenAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(note.dstTokenAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  note.dstProtocolAddress = 'd774e153442cb09f5c0d8d1b7bf7fe1bdd86c332';
  expect(note.dstProtocolAddress).toBe('d774e153442cb09f5c0d8d1b7bf7fe1bdd86c332');
  note.commitmentHash = new BN('baadf00d', 16);
  expect(toHexNoPrefix(note.commitmentHash)).toBe('baadf00d');
  note.encryptedOnChainNote = toBuff('deaddead');
  expect(toHexNoPrefix(note.encryptedOnChainNote)).toBe('deaddead');
  note.walletId = 100;
  expect(note.walletId).toBe(100);
  note.shieldedAddress =
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6';
  expect(note.shieldedAddress).toBe(
    'L9VrizoNHfBdtJsLT1Zp1iWAjqGXaWf9HvSJV9p2a7TszPWLnuTDq7rcLc4ykehRznJWFhvCTvCC1REWGUjR6B3C6',
  );
  note.withdrawTransactionHash = '0x4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e';
  expect(note.withdrawTransactionHash).toBe(
    '0x4eae1daf0632a8d540efc9308c1a9d5245b41d0c80527449d190fdb95e1b9c4e',
  );
  expect(() => {
    note.status = 'unknown status';
  }).toThrow();
  note.status = PrivateNoteStatus.SPENT;
  expect(note.status).toBe(PrivateNoteStatus.SPENT);
});
