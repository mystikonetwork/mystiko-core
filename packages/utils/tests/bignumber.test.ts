import { isBN, toBN } from '../src';

test('Test isBN', () => {
  expect(isBN(undefined)).toBe(false);
  expect(isBN('123')).toBe(false);
  expect(isBN(toBN('1230000'))).toBe(true);
});

test('Test toBN', () => {
  expect(toBN('1234').toString()).toBe('1234');
});
