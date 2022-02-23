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
  expect(errorMessage({ a: 1 })).toBe('{"a":1}');
  expect(errorMessage(1)).toBe('1');
});
