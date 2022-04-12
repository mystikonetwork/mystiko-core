import { RxDocument } from 'rxdb';
import { fromDecimals, toBN } from '@mystikonetwork/utils';
import { Commitment } from './commitment';
import { TransactionType } from '../schema';

export type TransactionMethods = {
  inputAmount: () => Promise<string>;
  inputSimpleAmount: () => Promise<number>;
  publicSimpleAmount: () => number;
  relayerFeeSimpleAmount: () => number;
  rollupFeeAmount: () => Promise<string>;
  rollupFeeSimpleAmount: () => Promise<number>;
};

export type Transaction = RxDocument<TransactionType, TransactionMethods>;

export const transactionMethods: TransactionMethods = {
  inputAmount(this: Transaction): Promise<string> {
    return this.populate('inputCommitments').then((inputCommitments: Commitment[]) => {
      const sum = toBN(0);
      inputCommitments.forEach((commitment) => sum.add(toBN(commitment.amount || '0')));
      return sum.toString();
    });
  },
  publicSimpleAmount(this: Transaction): number {
    return fromDecimals(this.publicAmount, this.assetDecimals);
  },
  relayerFeeSimpleAmount(this: Transaction): number {
    return fromDecimals(this.relayerFeeAmount, this.assetDecimals);
  },
  inputSimpleAmount(this: Transaction): Promise<number> {
    return this.inputAmount().then((amount) => fromDecimals(amount, this.assetDecimals));
  },
  rollupFeeAmount(this: Transaction): Promise<string> {
    return this.populate('inputCommitments').then((inputCommitments: Commitment[]) => {
      const sum = toBN(0);
      inputCommitments.forEach((commitment) => sum.add(toBN(commitment.rollupFeeAmount || '0')));
      return sum.toString();
    });
  },
  rollupFeeSimpleAmount(this: Transaction): Promise<number> {
    return this.rollupFeeAmount().then((amount) => fromDecimals(amount, this.assetDecimals));
  },
};
