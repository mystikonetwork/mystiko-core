import loki from 'lokijs';
import { BaseModel } from '../../src/model';

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
  db.close();
});
