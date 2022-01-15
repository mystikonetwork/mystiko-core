import { BaseConfig } from '../../src/config/common.js';

test('test toString', () => {
  expect(() => new BaseConfig()).toThrow();
  expect(() => new BaseConfig('')).toThrow();
  const conf1 = new BaseConfig({});
  const conf2 = new BaseConfig({ a: 1, b: 2 });
  const conf3 = new BaseConfig({ a: 1, b: 3 });
  const conf4 = new BaseConfig({ a: 1, b: 2 });
  expect(conf1.toString()).not.toBe(conf2.toString());
  expect(conf2.toString()).not.toBe(conf3.toString());
  expect(conf4.toString()).toBe(conf2.toString());
});

test('test isKeyExists', () => {
  expect(BaseConfig.isKeyExists(null, 'k1')).toBe(false);
  expect(BaseConfig.isKeyExists(undefined, 'k2')).toBe(false);
  expect(BaseConfig.isKeyExists('haha', 'k1')).toBe(false);
  expect(BaseConfig.isKeyExists({ a: 1 }, 'b')).toBe(false);
  expect(BaseConfig.isKeyExists({ a: 1 }, 'a')).toBe(true);
});

test('test checkKeyExists', () => {
  expect(() => BaseConfig.checkKeyExists(null, 'k1')).toThrow();
  expect(() => BaseConfig.checkKeyExists(undefined, 'k2')).toThrow();
  expect(() => BaseConfig.checkKeyExists('haha', 'k1')).toThrow();
  expect(() => BaseConfig.checkKeyExists({ a: 1 }, 'b')).toThrow();
  expect(BaseConfig.checkKeyExists({ a: 1 }, 'a')).toBe(undefined);
});

test('test checkString', () => {
  expect(() => BaseConfig.checkString({ a: '1' }, 'b')).toThrow();
  expect(BaseConfig.checkString({ a: '1' }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkString({ a: 1 }, 'a')).toThrow();
  expect(BaseConfig.checkString({ a: '1' }, 'a')).toBe(undefined);
});

test('test checkNumber', () => {
  expect(() => BaseConfig.checkNumber({ a: 1 }, 'b')).toThrow();
  expect(BaseConfig.checkNumber({ a: 1 }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkNumber({ a: '1' }, 'a')).toThrow();
  expect(BaseConfig.checkNumber({ a: 1 }, 'a')).toBe(undefined);
});

test('test checkObject', () => {
  expect(() => BaseConfig.checkObject({ a: {} }, 'b')).toThrow();
  expect(BaseConfig.checkObject({ a: {} }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkObject({ a: '1' }, 'a')).toThrow();
  expect(BaseConfig.checkObject({ a: {} }, 'a')).toBe(undefined);
});

test('test checkNumberArray', () => {
  expect(() => BaseConfig.checkNumberArray({ a: [1, 2] }, 'b')).toThrow();
  expect(BaseConfig.checkNumberArray({ a: [1, 2] }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkNumberArray({ a: [1, '2'] }, 'a')).toThrow();
  expect(BaseConfig.checkNumberArray({ a: [] }, 'a')).toBe(undefined);
  expect(BaseConfig.checkNumberArray({ a: [1, 2, 3] }, 'a')).toBe(undefined);
});

test('test checkStringArray', () => {
  expect(() => BaseConfig.checkStringArray({ a: ['1', '2'] }, 'b')).toThrow();
  expect(BaseConfig.checkStringArray({ a: ['1', '2'] }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkStringArray({ a: [1, '2'] }, 'a')).toThrow();
  expect(BaseConfig.checkStringArray({ a: [] }, 'a')).toBe(undefined);
  expect(BaseConfig.checkStringArray({ a: ['1', '2', '3'] }, 'a')).toBe(undefined);
});

test('test checkObjectArray', () => {
  expect(() => BaseConfig.checkObjectArray({ a: [{}, {}] }, 'b')).toThrow();
  expect(BaseConfig.checkObjectArray({ a: [{}, {}] }, 'b', false)).toBe(undefined);
  expect(() => BaseConfig.checkObjectArray({ a: [1, {}] }, 'a')).toThrow();
  expect(BaseConfig.checkObjectArray({ a: [] }, 'a')).toBe(undefined);
  expect(BaseConfig.checkObjectArray({ a: [{}, {}, {}] }, 'a')).toBe(undefined);
});

test('test checkEthAddress', () => {
  expect(() =>
    BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'b'),
  ).toThrow();
  expect(BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'b', false)).toBe(
    undefined,
  );
  expect(() => BaseConfig.checkEthAddress({ a: '0x7Acfe657fbEa241cfA138DC879' }, 'a')).toThrow();
  expect(BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'a')).toBe(
    undefined,
  );
});
