import { NextBytes, NextUint256, Skip, Uint256Size } from '../src/zeroCopySource';
import { toHexNoPrefix } from '../src';

test('test deserialize crossChain message success ', () => {
  const msg = {
    amount: '10000000000000000000',
    commitment: '7cfe7cb0d6b4ce474da7d66a67c61c4b3a34dcd90e1b4e93271add2aca50723',
    executorFee: '5000000000000',
    rollupFee: '10000000000000',
    privateNote:
      'a5ee71f34c28f56ee66b57f24a0b31ae04d90ce0f9358b7753ad4fc374ddecf6438b30ea3d8be9c458ec9142d3581df9e4e731135b5172d049bb1fb6850dd45102ce1b8cc6ae1a3c94a93d762fdda8dd952d8b169bfd70054829a3b254dbc411e452abf6c1ec67a5f9d153c6237232127be78c3365f27a408397b161a1c594110221be41c770035a2ec1c3d6772aa01b5d46ceedcba2466335b44dc5d5a8ca697d2a6b2eb873a21c48cabeb1a9bc3a7558aaca81e5c8f54abc3fef6bd1d6de2813bfe03a6eea09af4e226b1f4dba59d20e',
    message:
      '0000e8890423c78a0000000000000000000000000000000000000000000000002307a5acd2ad7132e9b4e190cd4da3b3c4617ca6667dda74e44c6b0dcbe7cf07005039278c04000000000000000000000000000000000000000000000000000000a0724e18090000000000000000000000000000000000000000000000000000d1a5ee71f34c28f56ee66b57f24a0b31ae04d90ce0f9358b7753ad4fc374ddecf6438b30ea3d8be9c458ec9142d3581df9e4e731135b5172d049bb1fb6850dd45102ce1b8cc6ae1a3c94a93d762fdda8dd952d8b169bfd70054829a3b254dbc411e452abf6c1ec67a5f9d153c6237232127be78c3365f27a408397b161a1c594110221be41c770035a2ec1c3d6772aa01b5d46ceedcba2466335b44dc5d5a8ca697d2a6b2eb873a21c48cabeb1a9bc3a7558aaca81e5c8f54abc3fef6bd1d6de2813bfe03a6eea09af4e226b1f4dba59d20e',
  };

  let r = NextUint256(msg.message, 0);
  if (r.output === undefined || r.outOffset === undefined) {
    fail('output undefined');
  }
  expect(r.output.toString()).toBe(msg.amount);

  r = NextUint256(msg.message, r.outOffset);
  if (r.output === undefined || r.outOffset === undefined) {
    fail('output undefined');
  }
  const commitmentHash = r.output;
  if (commitmentHash === undefined) {
    fail('commitment undefined');
  }
  expect(toHexNoPrefix(commitmentHash)).toBe(msg.commitment);

  r = NextUint256(msg.message, r.outOffset);
  if (r.output === undefined || r.outOffset === undefined) {
    fail('output undefined');
  }
  expect(r.output.toString()).toBe(msg.executorFee);

  r = NextUint256(msg.message, r.outOffset);
  if (r.output === undefined || r.outOffset === undefined) {
    fail('output undefined');
  }
  expect(r.output.toString()).toBe(msg.rollupFee);

  const r2 = NextBytes(msg.message, r.outOffset);
  if (r2.output === undefined || r2.outOffset === undefined) {
    fail('output undefined');
  }
  expect(r2.output.toString()).toBe(msg.privateNote);
});

test('test deserialize crossChain message wrong private note length ', () => {
  const msg = {
    amount: '10000000000000000000',
    commitment: '7cfe7cb0d6b4ce474da7d66a67c61c4b3a34dcd90e1b4e93271add2aca50723',
    executorFee: '5000000000000',
    rollupFee: '10000000000000',
    privateNote:
      'a5ee71f34c28f56ee66b57f24a0b31ae04d90ce0f9358b7753ad4fc374ddecf6438b30ea3d8be9c458ec9142d3581df9e4e731135b5172d049bb1fb6850dd45102ce1b8cc6ae1a3c94a93d762fdda8dd952d8b169bfd70054829a3b254dbc411e452abf6c1ec67a5f9d153c6237232127be78c3365f27a408397b161a1c594110221be41c770035a2ec1c3d6772aa01b5d46ceedcba2466335b44dc5d5a8ca697d2a6b2eb873a21c48cabeb1a9bc3a7558aaca81e5c8f54abc3fef6bd1d6de2813bfe03a6eea09af4e226b1f4dba59d20e',
    message:
      '0000e8890423c78a0000000000000000000000000000000000000000000000002307a5acd2ad7132e9b4e190cd4da3b3c4617ca6667dda74e44c6b0dcbe7cf07005039278c04000000000000000000000000000000000000000000000000000000a0724e18090000000000000000000000000000000000000000000000000000ffa5ee71f34c28f56ee66b57f24a0b31ae04d90ce0f9358b7753ad4fc374ddecf6438b30ea3d8be9c458ec9142d3581df9e4e731135b5172d049bb1fb6850dd45102ce1b8cc6ae1a3c94a93d762fdda8dd952d8b169bfd70054829a3b254dbc411e452abf6c1ec67a5f9d153c6237232127be78c3365f27a408397b161a1c594110221be41c770035a2ec1c3d6772aa01b5d46ceedcba2466335b44dc5d5a8ca697d2a6b2eb873a21c48cabeb1a9bc3a7558aaca81e5c8f54abc3fef6bd1d6de2813bfe03a6eea09af4e226b1f4dba59d20e',
  };

  let offset = Skip(msg.message, 0, Uint256Size);
  if (offset === undefined) {
    fail('offset undefined');
  }

  offset = Skip(msg.message, offset, Uint256Size);
  if (offset === undefined) {
    fail('offset undefined');
  }

  offset = Skip(msg.message, offset, Uint256Size);
  if (offset === undefined) {
    fail('offset undefined');
  }

  offset = Skip(msg.message, offset, Uint256Size);
  if (offset === undefined) {
    fail('offset undefined');
  }

  const r2 = NextBytes(msg.message, offset);
  expect(r2.output).toBe(undefined);
  expect(r2.outOffset).toBe(undefined);
});
