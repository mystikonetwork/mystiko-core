import { ethers } from 'ethers';
import { errorMessage, EtherError } from '../src';

test('Test errorMessage', () => {
  expect(errorMessage(undefined)).toBe('');
  expect(errorMessage(null)).toBe('');
  expect(errorMessage(new Error(undefined))).toBe('Error');
  expect(errorMessage(new Error('test'))).toBe('test');
  const error = new Error('abc') as EtherError;
  error.code = 'test code';
  expect(errorMessage(error)).toBe('[test code] abc');
  error.reason = 'error reason';
  expect(errorMessage(error)).toBe('[test code] error reason');
  error.code = ethers.errors.CALL_EXCEPTION;
  error.reason = 'transaction failed';
  expect(errorMessage(error)).toBe('transaction failed, please check block explorer for more information');
  expect(errorMessage({ a: 1 })).toBe('{"a":1}');
  expect(errorMessage({ data: { message: 'abc' } })).toBe('abc');
  expect(errorMessage(1)).toBe('1');
});
