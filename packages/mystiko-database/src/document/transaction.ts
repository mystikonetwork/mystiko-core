import { RxDocument } from 'rxdb';
import { fromDecimals, toBN } from '@mystikonetwork/utils';
import { Commitment } from './commitment';
import { TransactionType } from '../schema';

export type TransactionMethods = {
  inputAmount: () => Promise<string>;
  inputSimpleAmount: () => Promise<number>;
  simpleAmount: () => number;
  simplePublicAmount: () => number;
  simpleGasRelayerFeeAmount: () => number;
  simpleRollupFeeAmount: () => number;
};

export type Transaction = RxDocument<TransactionType, TransactionMethods>;

export const transactionMethods: TransactionMethods = {
  inputAmount(this: Transaction): Promise<string> {
    return this.populate('inputCommitments').then((inputCommitments: Commitment[]) => {
      let sum = toBN(0);
      inputCommitments.forEach((commitment) => {
        sum = sum.add(toBN(commitment.amount || '0'));
      });
      return sum.toString();
    });
  },
  inputSimpleAmount(this: Transaction): Promise<number> {
    return this.inputAmount().then((amount) => fromDecimals(amount, this.assetDecimals));
  },
  simpleAmount(this: Transaction): number {
    return fromDecimals(this.amount, this.assetDecimals);
  },
  simplePublicAmount(this: Transaction): number {
    return fromDecimals(this.publicAmount, this.assetDecimals);
  },
  simpleGasRelayerFeeAmount(this: Transaction): number {
    return fromDecimals(this.gasRelayerFeeAmount, this.assetDecimals);
  },
  simpleRollupFeeAmount(this: Transaction): number {
    return fromDecimals(this.rollupFeeAmount, this.assetDecimals);
  },
};
