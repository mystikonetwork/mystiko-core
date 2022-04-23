import { TransactionEnum } from '@mystikonetwork/database';
import { toBN, toDecimals } from '@mystikonetwork/utils';
import { CommitmentUtils } from '../../src';

test('test sum', () => {
  expect(CommitmentUtils.sum([]).toNumber()).toBe(0);
  expect(CommitmentUtils.sum([{}, {}]).toNumber()).toBe(0);
  expect(CommitmentUtils.sum([{ amount: '1' }, {}]).toNumber()).toBe(1);
  expect(CommitmentUtils.sum([{ amount: '1' }, { amount: '2' }]).toNumber()).toBe(3);
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

test('test sortByLeafIndex', () => {
  const commitments = [{ leafIndex: '1' }, { leafIndex: '3' }, { leafIndex: '2' }, { leafIndex: '2' }, {}];
  expect(CommitmentUtils.sortByLeafIndex(commitments).map((c) => c.leafIndex || '0')).toStrictEqual([
    '3',
    '2',
    '2',
    '1',
    '0',
  ]);
  expect(CommitmentUtils.sortByLeafIndex(commitments, false).map((c) => c.leafIndex || '0')).toStrictEqual([
    '0',
    '1',
    '2',
    '2',
    '3',
  ]);
});

test('test inputMax', () => {
  expect(CommitmentUtils.inputMax([], 100).toNumber()).toBe(0);
  const commitments = [{ amount: '1' }, { amount: '3' }, { amount: '2' }];
  expect(CommitmentUtils.inputMax(commitments, 1).toNumber()).toBe(3);
  expect(CommitmentUtils.inputMax(commitments, 2).toNumber()).toBe(5);
  expect(CommitmentUtils.inputMax(commitments, 3).toNumber()).toBe(6);
  expect(CommitmentUtils.inputMax(commitments, 4).toNumber()).toBe(6);
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
  expect(CommitmentUtils.select(commitments, 0, toBN(1))).toStrictEqual([]);
  expect(CommitmentUtils.select(commitments, 1, toBN(1))).toStrictEqual([{ amount: '1' }]);
  expect(CommitmentUtils.select(commitments, 1, toBN(2))).toStrictEqual([{ amount: '2' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(1))).toStrictEqual([{ amount: '1' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(2))).toStrictEqual([{ amount: '2' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(3))).toStrictEqual([{ amount: '3' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(8))).toStrictEqual([{ amount: '1' }, { amount: '7' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(9))).toStrictEqual([{ amount: '2' }, { amount: '7' }]);
  expect(CommitmentUtils.select(commitments, 2, toBN(14))).toStrictEqual([]);
});

test('test select exact match', () => {
  let commitments = [{ amount: '30' }, { amount: '12' }, { amount: '10' }];
  expect(CommitmentUtils.select(commitments, 2, toBN(22))).toStrictEqual([
    { amount: '10' },
    { amount: '12' },
  ]);
  commitments = [{ amount: '4' }, { amount: '18' }, { amount: '12' }, { amount: '10' }];
  expect(CommitmentUtils.select(commitments, 2, toBN(22))).toStrictEqual([{ amount: '4' }, { amount: '18' }]);
});

test('test quote transfer', () => {
  const config = { assetSymbol: 'MTT', assetDecimals: 18, minRollupFee: toDecimals(10) };
  let commitments = [{ amount: toDecimals(1).toString() }];
  let quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('asset balance is too small to transfer');
  commitments = [{ amount: toDecimals(10).toString() }];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('asset balance is too small to transfer');
  commitments = [{ amount: toDecimals(11).toString() }];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('your asset amount should be exactly 11');
  expect(quote.minAmount).toBe(11);
  expect(quote.maxAmount).toBe(11);
  expect(quote.fixedAmount).toBe(true);
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER, amount: 11 }, config, commitments, 2);
  expect(quote.valid).toBe(true);
  expect(quote.numOfSplits).toBe(1);
  expect(quote.maxGasRelayerFee).toBe(1);
  commitments = [{ amount: toDecimals(20).toString() }];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('your asset amount should be exactly 20');
  expect(quote.minAmount).toBe(20);
  expect(quote.maxAmount).toBe(20);
  expect(quote.fixedAmount).toBe(true);
  commitments = [{ amount: toDecimals(21).toString() }];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('asset amount must be greater than 20');
  expect(quote.minAmount).toBe(20);
  expect(quote.maxAmount).toBe(21);
  expect(quote.fixedAmount).toBe(false);
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER, amount: 22 }, config, commitments, 2);
  expect(quote.valid).toBe(false);
  expect(quote.invalidReason).toBe('asset amount cannot exceed 21');
  commitments = [{ amount: toDecimals(30).toString() }];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER, amount: 22 }, config, commitments, 2);
  expect(quote.valid).toBe(true);
  expect(quote.numOfSplits).toBe(2);
  expect(quote.maxGasRelayerFee).toBe(2);
  commitments = [
    { amount: toDecimals(30).toString() },
    { amount: toDecimals(12).toString() },
    { amount: toDecimals(10).toString() },
  ];
  quote = CommitmentUtils.quote({ type: TransactionEnum.TRANSFER, amount: 22 }, config, commitments, 2);
  expect(quote.valid).toBe(true);
  expect(quote.numOfSplits).toBe(1);
});

test('test quote withdraw', () => {
  const config = { assetSymbol: 'MTT', assetDecimals: 18, minRollupFee: toDecimals(10) };
  let commitments = [{ amount: toDecimals(1).toString() }];
  let quote = CommitmentUtils.quote(
    { type: TransactionEnum.WITHDRAW, publicAmount: 1 },
    config,
    commitments,
    2,
  );
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  expect(quote.fixedAmount).toBe(true);
  expect(quote.maxAmount).toBe(1);
  expect(quote.minAmount).toBe(1);
  expect(quote.maxGasRelayerFee).toBe(1);
  expect(quote.numOfSplits).toBe(0);
  commitments = [{ amount: toDecimals(11).toString() }];
  quote = CommitmentUtils.quote(
    { type: TransactionEnum.WITHDRAW, publicAmount: 10.5 },
    config,
    commitments,
    2,
  );
  expect(quote.valid).toBe(true);
  expect(quote.invalidReason).toBe(undefined);
  expect(quote.fixedAmount).toBe(false);
  expect(quote.maxAmount).toBe(11);
  expect(quote.minAmount).toBe(0);
  expect(quote.maxGasRelayerFee).toBe(0.5);
  expect(quote.numOfSplits).toBe(1);
  quote = CommitmentUtils.quote({ type: TransactionEnum.WITHDRAW }, config, commitments, 2);
  expect(quote.valid).toBe(false);
});
