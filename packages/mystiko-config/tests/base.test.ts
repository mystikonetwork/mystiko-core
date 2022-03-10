import { BaseConfig } from '../src';

test('test getRawConfig', () => {
  const conf1 = new BaseConfig({});
  const conf2 = new BaseConfig({ a: 1, b: 2 });
  expect(conf1.getRawConfig()).toStrictEqual({});
  expect(conf2.getRawConfig()).toStrictEqual({ a: 1, b: 2 });
});

test('test toString', () => {
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
  BaseConfig.checkKeyExists({ a: 1 }, 'a');
});

test('test checkString', () => {
  expect(() => BaseConfig.checkString({ a: '1' }, 'b')).toThrow();
  BaseConfig.checkString({ a: '1' }, 'b', false);
  expect(() => BaseConfig.checkString({ a: 1 }, 'a')).toThrow();
  BaseConfig.checkString({ a: '1' }, 'a');
});

test('test checkNumber', () => {
  expect(() => BaseConfig.checkNumber({ a: 1 }, 'b')).toThrow();
  BaseConfig.checkNumber({ a: 1 }, 'b', false);
  expect(() => BaseConfig.checkNumber({ a: '1' }, 'a')).toThrow();
  BaseConfig.checkNumber({ a: 1 }, 'a');
});

test('test checkNumberString', () => {
  expect(() => BaseConfig.checkNumberString({ a: '1' }, 'b')).toThrow();
  BaseConfig.checkNumberString({ a: '1' }, 'b', false);
  expect(() => BaseConfig.checkNumberString({ a: '1abc' }, 'a')).toThrow();
  BaseConfig.checkNumberString({ a: '1' }, 'a');
});

test('test checkObject', () => {
  expect(() => BaseConfig.checkObject({ a: {} }, 'b')).toThrow();
  BaseConfig.checkObject({ a: {} }, 'b', false);
  expect(() => BaseConfig.checkObject({ a: '1' }, 'a')).toThrow();
  BaseConfig.checkObject({ a: {} }, 'a');
});

test('test checkArray', () => {
  expect(() => BaseConfig.checkArray({ a: [1, 2] }, 'b')).toThrow();
  BaseConfig.checkArray({ a: [1, 2] }, 'b', false);
  BaseConfig.checkArray({ a: [1, '2'] }, 'a');
  BaseConfig.checkArray({ a: [] }, 'a');
});

test('test checkNumberArray', () => {
  expect(() => BaseConfig.checkNumberArray({ a: [1, 2] }, 'b')).toThrow();
  BaseConfig.checkNumberArray({ a: [1, 2] }, 'b', false);
  expect(() => BaseConfig.checkNumberArray({ a: [1, '2'] }, 'a')).toThrow();
  BaseConfig.checkNumberArray({ a: [] }, 'a');
  BaseConfig.checkNumberArray({ a: [1, 2, 3] }, 'a');
});

test('test checkStringArray', () => {
  expect(() => BaseConfig.checkStringArray({ a: ['1', '2'] }, 'b')).toThrow();
  BaseConfig.checkStringArray({ a: ['1', '2'] }, 'b', false);
  expect(() => BaseConfig.checkStringArray({ a: [1, '2'] }, 'a')).toThrow();
  BaseConfig.checkStringArray({ a: [] }, 'a');
  BaseConfig.checkStringArray({ a: ['1', '2', '3'] }, 'a');
});

test('test checkObjectArray', () => {
  expect(() => BaseConfig.checkObjectArray({ a: [{}, {}] }, 'b')).toThrow();
  BaseConfig.checkObjectArray({ a: [{}, {}] }, 'b', false);
  expect(() => BaseConfig.checkObjectArray({ a: [1, {}] }, 'a')).toThrow();
  BaseConfig.checkObjectArray({ a: [] }, 'a');
  BaseConfig.checkObjectArray({ a: [{}, {}, {}] }, 'a');
});

test('test checkEthAddress', () => {
  expect(() =>
    BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'b'),
  ).toThrow();
  BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'b', false);
  expect(() => BaseConfig.checkEthAddress({ a: '0x7Acfe657fbEa241cfA138DC879' }, 'a')).toThrow();
  BaseConfig.checkEthAddress({ a: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879' }, 'a');
});
