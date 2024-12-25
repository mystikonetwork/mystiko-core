import { fromDecimalsWithPrecision } from '../../src';

test('test convert fromDecimalsWithPrecision', () => {
  expect(fromDecimalsWithPrecision('1', 18)).toBe(1e-8);
  expect(fromDecimalsWithPrecision('123000000000', 18)).toBe(13e-8);
  expect(fromDecimalsWithPrecision('123000000000000000000', 18)).toBe(123);
  expect(fromDecimalsWithPrecision('123000000010000000000', 18)).toBe(123.00000001);
  expect(fromDecimalsWithPrecision('123000000011000000000', 18)).toBe(123.00000002);
  expect(fromDecimalsWithPrecision('1', 6)).toBe(1e-6);
  expect(fromDecimalsWithPrecision('123000000', 6)).toBe(123);
  expect(fromDecimalsWithPrecision('123000001', 6)).toBe(123.000001);
});
