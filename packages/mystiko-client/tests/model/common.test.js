import loki from 'lokijs';
import { toBN } from '@mystiko/utils';
import { BaseModel, ID_KEY } from '../../src/model';

class TestModel extends BaseModel {
  constructor(data = {}) {
    super(data);
  }
  get col() {
    return this.data['col'];
  }

  get bn() {
    return this.data['bn'] ? toBN(this.data['bn']) : undefined;
  }
}

test('Test BaseModel', () => {
  const db = new loki('test.db');
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
  model2.data['count'] = 2;
  users.update(model2.data);
  expect(model2.updatedAt).toBeGreaterThan(0);
  const model3 = new BaseModel(model2);
  expect(model3.data).toStrictEqual(model2.data);
  db.close();
});

test('Test columnComparator', () => {
  let model1 = new TestModel({ [ID_KEY]: 1, col: -1, bn: toBN(3) });
  let model2 = new TestModel({ [ID_KEY]: 2, col: 2, bn: toBN(1) });
  let model3 = new TestModel({ [ID_KEY]: 3, col: undefined, bn: undefined });
  let model4 = new TestModel({ [ID_KEY]: 4, col: null, bn: null });
  let model5 = new TestModel({ [ID_KEY]: 5, col: 3, bn: toBN(2) });
  let model6 = new TestModel({ [ID_KEY]: 6, col: 3, bn: toBN(2) });
  let model7 = new TestModel({ [ID_KEY]: 7, col: 1, bn: toBN(100) });
  let models = [model1, model2, model3, model4, model5, model6, model7];
  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'col');
    return ret === 0 ? first.id - second.id : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([3, 4, 1, 7, 2, 5, 6]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'col', true);
    return ret === 0 ? second.id - first.id : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([6, 5, 2, 7, 1, 4, 3]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'bn');
    return ret === 0 ? first.id - second.id : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([3, 4, 2, 5, 6, 1, 7]);

  models.sort((first, second) => {
    const ret = BaseModel.columnComparator(first, second, 'bn', true);
    return ret === 0 ? second.id - first.id : ret;
  });
  expect(models.map((m) => m.id)).toStrictEqual([7, 1, 6, 5, 2, 4, 3]);
});
