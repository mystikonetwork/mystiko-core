import {
  toBN,
  bnToFixedBytes,
  BN_LEN,
  toHexNoPrefix,
  toBuff,
  toDecimals,
  fromDecimals,
  toFixedLenHex,
  toHex,
  toFixedLenHexNoPrefix,
  deepCopy,
  toString,
  toFixedString,
} from '../src';

test('Test bnToFixedBytes', () => {
  const bn1 = toBN(0xdeadbeef);
  const bn1Bytes = bnToFixedBytes(bn1);
  expect(bn1Bytes.length).toBe(BN_LEN);
  expect(toHexNoPrefix(bn1Bytes)).toBe('00000000000000000000000000000000000000000000000000000000deadbeef');
});

test('Test toBuff', () => {
  expect(toBuff('0xdeadbeef').length).toBe(4);
  expect(toHexNoPrefix(toBuff('deadbeef'))).toBe('deadbeef');
});

test('Test toDecimals', () => {
  expect(toDecimals(0).toNumber()).toBe(0);
  expect(toDecimals(2, 4).toString()).toBe('20000');
  expect(toDecimals(0.1, 2).toString()).toBe('10');
  expect(toDecimals(0.01, 4).toString()).toBe('100');
  expect(toDecimals(1e-18).toString()).toBe('1');
});

test('Test fromDecimals', () => {
  expect(fromDecimals(toBN('1'), 4)).toBe(0.0001);
  expect(fromDecimals(toBN('1000000000000000000'))).toBe(1);
  expect(fromDecimals('1000000000000000000')).toBe(1);
});

test('Test toFixedLenHex', () => {
  expect(toFixedLenHex('dead', 4)).toBe('0x0000dead');
  expect(toFixedLenHex('0Xdead', 4)).toBe('0x0000dead');
  expect(toFixedLenHex('0xdead', 4)).toBe('0x0000dead');
  expect(toFixedLenHex(toBN('dead', 16), 4)).toBe('0x0000dead');
  expect(toFixedLenHex(Buffer.from('dead', 'hex'), 4)).toBe('0x0000dead');
  expect(toFixedLenHex(Uint8Array.from([0xde, 0xad]), 4)).toBe('0x0000dead');
  expect(toFixedLenHex(57005, 4)).toBe('0x0000dead');
});

test('Test toHex', () => {
  expect(toHex('dead')).toBe('0xdead');
  expect(toHex('0xdead')).toBe('0xdead');
  expect(toHex('0Xdead')).toBe('0xdead');
  expect(toHex(toBN('dead', 16))).toBe('0xdead');
  expect(toHex(Buffer.from('dead', 'hex'))).toBe('0xdead');
  expect(toHex(Uint8Array.from([0xde, 0xad]))).toBe('0xdead');
  expect(toHex(57005)).toBe('0xdead');
});

test('Test toHexNoPrefix', () => {
  expect(toHexNoPrefix('dead')).toBe('dead');
  expect(toHexNoPrefix('0xdead')).toBe('dead');
  expect(toHexNoPrefix('0Xdead')).toBe('dead');
  expect(toHexNoPrefix(toBN('dead', 16))).toBe('dead');
  expect(toHexNoPrefix(Buffer.from('dead', 'hex'))).toBe('dead');
  expect(toHexNoPrefix(Uint8Array.from([0xde, 0xad]))).toBe('dead');
  expect(toHexNoPrefix(57005)).toBe('dead');
});

test('Test toFixedLenHexNoPrefix', () => {
  expect(toFixedLenHexNoPrefix('dead', 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix('0Xdead', 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix('0xdead', 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix(toBN('dead', 16), 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix(Buffer.from('dead', 'hex'), 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix(Uint8Array.from([0xde, 0xad]), 4)).toBe('0000dead');
  expect(toFixedLenHexNoPrefix(57005, 4)).toBe('0000dead');
});

test('Test toString', () => {
  expect(toString(undefined)).toBe('');
  expect(toString(null)).toBe('');
  expect(toString(0)).toBe('0');
  expect(toString(1)).toBe('1');
  expect(toString(new Error('msg'))).toBe('Error: msg');
});

test('Test toFixedString', () => {
  expect(toFixedString(0.000000000000001)).toBe('0.000000000000001');
  expect(toFixedString(23423423)).toBe('23423423');
  expect(toFixedString(1.1e12)).toBe('1100000000000');
});

test('Test deepCopy', () => {
  expect(deepCopy(1)).toBe(1);
  expect(deepCopy('1')).toBe('1');
  expect(deepCopy(['1'])).toStrictEqual(['1']);
  const original = { a: 1, b: 2 };
  const copied = deepCopy(original);
  expect(copied).toStrictEqual(original);
  original.a = 2;
  expect(copied.a).toBe(1);
});
