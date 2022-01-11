import BN from 'bn.js';
import * as utils from '../src/utils.js';

test('Test bnToFixedBytes', () => {
  const bn1 = new BN(0xdeadbeef);
  const bn1Bytes = utils.bnToFixedBytes(bn1);
  expect(bn1Bytes.length).toBe(utils.BN_LEN);
  expect(bn1Bytes.toString('hex')).toBe('00000000000000000000000000000000000000000000000000000000deadbeef');
});

test('Test check', () => {
  expect(() => utils.check(1 === 2, 'failed')).toThrow('failed');
  expect(utils.check(1 === 1, '')).toBe(undefined);
  expect(() => utils.checkNotNull(null, 'failed')).toThrow('failed');
  expect(utils.checkNotNull('', '')).toBe(undefined);
  expect(() => utils.checkDefined(undefined, 'failed')).toThrow('failed');
  expect(utils.checkDefined('', '')).toBe(undefined);
  expect(() => utils.checkDefinedAndNotNull(undefined, 'failed')).toThrow('failed');
  expect(() => utils.checkDefinedAndNotNull(null, 'failed')).toThrow('failed');
  expect(utils.checkDefinedAndNotNull('', '')).toBe(undefined);
});

test('Test toDecimals', () => {
  expect(utils.toDecimals(2, 4).toString()).toBe('20000');
});

test('Test toFixedLenHex', () => {
  expect(utils.toFixedLenHex('dead', 4)).toBe('0x0000dead');
});

test('Test toHex', () => {
  expect(utils.toHex('dead')).toBe('0xdead');
});