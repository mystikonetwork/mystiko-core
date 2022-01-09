import { BigNumber } from 'bignumber.js';
import { bnToFixedBytes, BN_LEN } from '../src/utils.js';

test('Test bnToFixedBytes', () => {
  const bn1 = new BigNumber(0xdeadbeef);
  const bn1Bytes = bnToFixedBytes(bn1);
  expect(bn1Bytes.length).toBe(BN_LEN);
  expect(bn1Bytes.toString('hex')).toBe('00000000000000000000000000000000000000000000000000000000deadbeef');
});
