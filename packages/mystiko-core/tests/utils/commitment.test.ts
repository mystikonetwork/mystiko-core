import { CommitmentUtils } from '../../src';

test('test sum', () => {
  expect(CommitmentUtils.sum([])).toBe('0');
  expect(CommitmentUtils.sum([{}, {}])).toBe('0');
  expect(CommitmentUtils.sum([{ amount: '1' }, {}])).toBe('1');
  expect(CommitmentUtils.sum([{ amount: '1' }, { amount: '2' }])).toBe('3');
});

test('test sort', () => {
  const commitments = [{ amount: '1' }, { amount: '3' }, { amount: '2' }, { amount: '2' }, {}];
  expect(CommitmentUtils.sort(commitments).map((c) => c.amount || '0')).toStrictEqual([
    '3',
    '2',
    '2',
    '1',
    '0',
  ]);
  expect(CommitmentUtils.sort(commitments, false).map((c) => c.amount || '0')).toStrictEqual([
    '0',
    '1',
    '2',
    '2',
    '3',
  ]);
});

test('test inputMax', () => {
  expect(CommitmentUtils.inputMax([], 100)).toBe('0');
  const commitments = [{ amount: '1' }, { amount: '3' }, { amount: '2' }];
  expect(CommitmentUtils.inputMax(commitments, 1)).toBe('3');
  expect(CommitmentUtils.inputMax(commitments, 2)).toBe('5');
  expect(CommitmentUtils.inputMax(commitments, 3)).toBe('6');
  expect(CommitmentUtils.inputMax(commitments, 4)).toBe('6');
});

test('test select', () => {
  const commitments = [
    { amount: '1' },
    { amount: '3' },
    { amount: '2' },
    { amount: '7' },
    { amount: '4' },
    { amount: '5' },
    { amount: '6' },
    {},
  ];
  expect(CommitmentUtils.select(commitments, 0, '1')).toStrictEqual([]);
  expect(CommitmentUtils.select(commitments, 1, '1')).toStrictEqual([{ amount: '1' }]);
  expect(CommitmentUtils.select(commitments, 1, '2')).toStrictEqual([{ amount: '2' }]);
  expect(CommitmentUtils.select(commitments, 2, '1')).toStrictEqual([{ amount: '1' }]);
  expect(CommitmentUtils.select(commitments, 2, '2')).toStrictEqual([{ amount: '2' }]);
  expect(CommitmentUtils.select(commitments, 2, '3')).toStrictEqual([{ amount: '3' }]);
  expect(CommitmentUtils.select(commitments, 2, '8')).toStrictEqual([{ amount: '1' }, { amount: '7' }]);
  expect(CommitmentUtils.select(commitments, 2, '9')).toStrictEqual([{ amount: '2' }, { amount: '7' }]);
  expect(CommitmentUtils.select(commitments, 2, '14')).toStrictEqual([]);
});
