import { check, checkNotNull, checkDefined, checkDefinedAndNotNull } from '../src';

test('Test check', () => {
  expect(() => check(false, 'failed')).toThrow('failed');
  check(true, '');
  expect(() => checkNotNull(null, 'failed')).toThrow('failed');
  checkNotNull('', '');
  expect(() => checkDefined(undefined, 'failed')).toThrow('failed');
  checkDefined('', '');
  expect(() => checkDefinedAndNotNull(undefined, 'failed')).toThrow('failed');
  expect(() => checkDefinedAndNotNull(null, 'failed')).toThrow('failed');
  checkDefinedAndNotNull('', '');
});
