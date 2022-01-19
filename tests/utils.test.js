import BN from 'bn.js';
import * as utils from '../src/utils.js';

test('Test bnToFixedBytes', () => {
  const bn1 = new BN(0xdeadbeef);
  const bn1Bytes = utils.bnToFixedBytes(bn1);
  expect(bn1Bytes.length).toBe(utils.BN_LEN);
  expect(utils.toHexNoPrefix(bn1Bytes)).toBe(
    '00000000000000000000000000000000000000000000000000000000deadbeef',
  );
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

test('Test toBuff', () => {
  expect(() => utils.toBuff(1234)).toThrow();
  expect(utils.toBuff('0xdeadbeef').length).toBe(4);
  expect(utils.toHexNoPrefix(utils.toBuff('deadbeef'))).toBe('deadbeef');
});

test('Test toDecimals', () => {
  expect(utils.toDecimals(2, 4).toString()).toBe('20000');
});

test('Test toFixedLenHex', () => {
  expect(utils.toFixedLenHex('dead', 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex('0Xdead', 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex('0xdead', 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex(new BN('dead', 16), 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex(Buffer.from('dead', 'hex'), 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex(Uint8Array.from([0xde, 0xad]), 4)).toBe('0x0000dead');
  expect(utils.toFixedLenHex(57005, 4)).toBe('0x0000dead');
  expect(() => utils.toFixedLenHex({})).toThrow();
});

test('Test toHex', () => {
  expect(utils.toHex('dead')).toBe('0xdead');
  expect(utils.toHex('0xdead')).toBe('0xdead');
  expect(utils.toHex('0Xdead')).toBe('0xdead');
  expect(utils.toHex(new BN('dead', 16))).toBe('0xdead');
  expect(utils.toHex(Buffer.from('dead', 'hex'))).toBe('0xdead');
  expect(utils.toHex(Uint8Array.from([0xde, 0xad]))).toBe('0xdead');
  expect(utils.toHex(57005, 4)).toBe('0xdead');
  expect(() => utils.toHex({})).toThrow();
});

test('Test toHexNoPrefix', () => {
  expect(utils.toHexNoPrefix('dead')).toBe('dead');
  expect(utils.toHexNoPrefix('0xdead')).toBe('dead');
  expect(utils.toHexNoPrefix('0Xdead')).toBe('dead');
  expect(utils.toHexNoPrefix(new BN('dead', 16))).toBe('dead');
  expect(utils.toHexNoPrefix(Buffer.from('dead', 'hex'))).toBe('dead');
  expect(utils.toHexNoPrefix(Uint8Array.from([0xde, 0xad]))).toBe('dead');
  expect(utils.toHexNoPrefix(57005, 4)).toBe('dead');
  expect(() => utils.toHexNoPrefix({})).toThrow();
});

test('Test toFixedLenHexNoPrefix', () => {
  expect(utils.toFixedLenHexNoPrefix('dead', 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix('0Xdead', 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix('0xdead', 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix(new BN('dead', 16), 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix(Buffer.from('dead', 'hex'), 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix(Uint8Array.from([0xde, 0xad]), 4)).toBe('0000dead');
  expect(utils.toFixedLenHexNoPrefix(57005, 4)).toBe('0000dead');
  expect(() => utils.toFixedLenHexNoPrefix({})).toThrow();
});

test('Test toString', () => {
  expect(utils.toString(undefined)).toBe('');
  expect(utils.toString(null)).toBe('');
  expect(utils.toString(1)).toBe('1');
  expect(utils.toString(new Error('msg'))).toBe('Error: msg');
});

test('Test readJsonFile', async () => {
  const data = await utils.readJsonFile('tests/utils.test.json');
  expect(data['test']).toBe(true);
});
