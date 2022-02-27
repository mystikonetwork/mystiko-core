import { isValidVersion } from '../src';

test('test isValidVersion', () => {
  expect(isValidVersion('0.0.1')).toBe(true);
  expect(isValidVersion(String('1.2.3'))).toBe(true);
  expect(isValidVersion('a.1.2')).toBe(false);
});
