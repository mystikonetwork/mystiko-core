import { Event } from '../../src/model';

test('test Event getters/setters', () => {
  const event = new Event();
  expect(event.chainId).toBe(undefined);
  expect(event.contractAddress).toBe(undefined);
  expect(event.topic).toBe(undefined);
  expect(event.argumentData).toBe(undefined);
  expect(event.transactionHash).toBe(undefined);

  event.chainId = 10;
  expect(event.chainId).toBe(10);
  event.contractAddress = '0xCD8BbF2f05Fbc87dA28844B33D06c5c249598223';
  expect(event.contractAddress).toBe('0xCD8BbF2f05Fbc87dA28844B33D06c5c249598223');
  event.topic = 'MerkleTreeInsert';
  expect(event.topic).toBe('MerkleTreeInsert');
  event.argumentData = { a: 1, b: 2 };
  expect(event.argumentData).toStrictEqual({ a: 1, b: 2 });
  event.transactionHash = '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8';
  expect(event.transactionHash).toBe('0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8');
});
