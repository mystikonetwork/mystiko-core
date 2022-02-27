import BN from 'bn.js';
import Loki from 'lokijs';
import { toBN } from '@mystiko/utils';
import { BaseModel, ID_KEY } from '../../src';

interface RawTestModel {
  col?: number;
  bn?: number;
}

class TestModel extends BaseModel {
  constructor(data = {}) {
    super(data);
  }

  public get col(): number | undefined {
    return (this.data as RawTestModel).col;
  }

  public get bn(): BN | undefined {
    const raw = (this.data as RawTestModel).bn;
    return raw ? toBN(raw) : undefined;
  }
}

test('Test BaseModel', () => {
  const db = new Loki('test.db');
  const users = db.addCollection('users');
  const model1 = new BaseModel();
  expect(model1.id).toBe(undefined);
  expect(model1.createdAt).toBe(0);
  expect(model1.updatedAt).toBe(0);
  expect(model1.toString()).toBe('{}');
  const model2 = new BaseModel(users.insert({ name: 'alice', count: 1 }));
  expect(model2.id).toBe(1);
  expect(model2.createdAt).toBeGreaterThan(0);
  expect(model2.updatedAt).toBe(0);
  (model2.data as { count: number }).count = 2;
  users.update(model2.data);
  expect(model2.updatedAt).toBeGreaterThan(0);
  const model3 = new BaseModel(model2);
  expect(model3.data).toStrictEqual(model2.data);
  db.close();
});

test('Test columnComparator', () => {
  const model1 = new TestModel({ [ID_KEY]: 1, col: -1, bn: 3 });
  const model2 = new TestModel({ [ID_KEY]: 2, col: 2, bn: 1 });
  const model3 = new TestModel({ [ID_KEY]: 3, col: undefined, bn: undefined });
  const model4 = new TestModel({ [ID_KEY]: 4, col: null, bn: null });
  const model5 = new TestModel({ [ID_KEY]: 5, col: 3, bn: 2 });
  const model6 = new TestModel({ [ID_KEY]: 6, col: 3, bn: 2 });
  const model7 = new TestModel({ [ID_KEY]: 7, col: 1, bn: 100 });
  const models = [model1, model2, model3, model4, model5, model6, model7];
  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'col');
    return ret === 0 ? (first.id || 0) - (second.id || 0) : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([3, 4, 1, 7, 2, 5, 6]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'col', true);
    return ret === 0 ? (second.id || 0) - (first.id || 0) : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([6, 5, 2, 7, 1, 4, 3]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'bn');
    return ret === 0 ? (first.id || 0) - (second.id || 0) : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([3, 4, 2, 5, 6, 1, 7]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'bn', true);
    return ret === 0 ? (second.id || 0) - (first.id || 0) : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([7, 1, 6, 5, 2, 4, 3]);
});
