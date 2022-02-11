import { isValidVersion } from '../src/version';

test('test isValidVersion', () => {
  expect(isValidVersion(undefined)).toBe(false);
  expect(isValidVersion(null)).toBe(false);
  expect(isValidVersion('0.0.1')).toBe(true);
  expect(isValidVersion(String('1.2.3'))).toBe(true);
  expect(isValidVersion('a.1.2')).toBe(false);
});
