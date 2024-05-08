import { TransactionEnum } from '@mystikonetwork/database';
import { fromDecimals, toBN, toDecimals } from '@mystikonetwork/utils';
import BN from 'bn.js';
import { TransactionQuote } from '../interface';

type CommitmentLike = {
  leafIndex?: string;
  amount?: string;
};

type TransactionQuoteOptionsLike = {
  type: TransactionEnum;
  publicAmount?: number;
  amount?: number;
};

type PoolContractConfigLike = {
  assetSymbol: string;
  assetDecimals: number;
  minRollupFee: BN;
  disabled: boolean;
};

export class CommitmentUtils {
  public static sum<C extends CommitmentLike>(commitments: C[]): BN {
    return commitments.map((c) => c.amount || '0').reduce((c1, c2) => toBN(c1).add(toBN(c2)), toBN(0));
  }

  public static sort<C extends CommitmentLike>(commitments: C[], desc = true): C[] {
    return commitments.sort((c1, c2) => {
      const amount1 = toBN(c1.amount || 0);
      const amount2 = toBN(c2.amount || 0);
      const leafIndex1 = toBN(c1.leafIndex || 0);
      const leafIndex2 = toBN(c2.leafIndex || 0);
      if (amount2.gt(amount1)) {
        return desc ? 1 : -1;
      }
      if (amount2.lt(amount1)) {
        return desc ? -1 : 1;
      }
      return desc ? leafIndex2.cmp(leafIndex1) : leafIndex1.cmp(leafIndex2);
    });
  }

  public static sortByLeafIndex<C extends CommitmentLike>(commitments: C[], desc = true): C[] {
    return commitments.sort((c1, c2) => {
      const index1 = toBN(c1.leafIndex || 0);
      const index2 = toBN(c2.leafIndex || 0);
      if (index2.gt(index1)) {
        return desc ? 1 : -1;
      }
      if (index2.lt(index1)) {
        return desc ? -1 : 1;
      }
      return 0;
    });
  }

  public static inputMax<C extends CommitmentLike>(commitments: C[], numInputs: number): BN {
    return this.sum(this.sort(commitments).slice(0, numInputs));
  }

  public static select<C extends CommitmentLike>(commitments: C[], numInputs: number, amount: BN): C[] {
    const sortedCommitments = this.sort(commitments, false);
    const exactMatched = this.selectSorted(sortedCommitments, numInputs, amount, true);
    if (exactMatched.length === 0) {
      return this.selectSorted(sortedCommitments, numInputs, amount);
    }
    return exactMatched;
  }

  public static quote<C extends CommitmentLike>(
    options: TransactionQuoteOptionsLike,
    contractConfig: PoolContractConfigLike,
    commitments: C[],
    numInputs: number,
  ): TransactionQuote {
    const { assetSymbol, assetDecimals, minRollupFee } = contractConfig;
    const inputMax = this.inputMax(commitments, numInputs);
    const balance = this.sum(commitments);
    const maxNumOfSplits = options.type === TransactionEnum.TRANSFER ? 2 : 1;
    const totalMinRollupFee = minRollupFee.mul(toBN(maxNumOfSplits));
    const minAmount = options.type === TransactionEnum.TRANSFER ? totalMinRollupFee : toBN(0);
    const fixedAmount = inputMax.lte(totalMinRollupFee);
    const transactionQuote: TransactionQuote = {
      valid: true,
      balance: fromDecimals(balance, assetDecimals),
      numOfInputs: numInputs,
      numOfSplits: maxNumOfSplits,
      minRollupFee: fromDecimals(minRollupFee, assetDecimals),
      rollupFeeAssetSymbol: assetSymbol,
      minAmount: fromDecimals(fixedAmount ? inputMax : minAmount, assetDecimals),
      maxAmount: fromDecimals(inputMax, assetDecimals),
      fixedAmount,
      maxGasRelayerFee: 0,
      gasRelayerFeeAssetSymbol: assetSymbol,
    };
    if (inputMax.lte(minRollupFee.mul(toBN(maxNumOfSplits - 1)))) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason = 'asset balance is too small to transfer';
      return transactionQuote;
    }
    let amount: BN;
    if (options.type === TransactionEnum.TRANSFER) {
      amount = options.amount ? toDecimals(options.amount, contractConfig.assetDecimals) : inputMax;
    } else {
      amount = options.publicAmount
        ? toDecimals(options.publicAmount, contractConfig.assetDecimals)
        : inputMax;
    }
    if (amount.lten(0)) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason = 'asset amount cannot be negative or zero';
      return transactionQuote;
    }
    if (amount.gt(inputMax)) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason = `asset amount cannot exceed ${transactionQuote.maxAmount}`;
      return transactionQuote;
    }
    if (amount.eq(inputMax)) {
      const selected = this.select(commitments, numInputs, amount);
      transactionQuote.numOfInputs = selected.length;
      transactionQuote.numOfSplits = maxNumOfSplits - 1;
      transactionQuote.maxGasRelayerFee = fromDecimals(
        amount.sub(minRollupFee.mul(toBN(maxNumOfSplits - 1))),
        assetDecimals,
      );
      if (contractConfig.disabled && transactionQuote.numOfSplits > 0) {
        transactionQuote.valid = false;
        transactionQuote.invalidReason =
          'pool is disabled for transfer or splits, please withdraw max amounts allowed';
        return transactionQuote;
      }
      return transactionQuote;
    }
    if (transactionQuote.fixedAmount) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason = `your asset amount should be exactly ${transactionQuote.maxAmount}`;
      return transactionQuote;
    }
    if (amount.lte(minAmount)) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason = `asset amount must be greater than ${transactionQuote.minAmount}`;
      return transactionQuote;
    }
    const selected = this.select(commitments, numInputs, amount);
    const selectedSum = this.sum(selected);
    transactionQuote.numOfInputs = selected.length;
    transactionQuote.numOfSplits = selectedSum.eq(amount) ? maxNumOfSplits - 1 : maxNumOfSplits;
    transactionQuote.maxGasRelayerFee = fromDecimals(
      amount.sub(minRollupFee.mul(toBN(transactionQuote.numOfSplits))),
      assetDecimals,
    );
    if (contractConfig.disabled && transactionQuote.numOfSplits > 0) {
      transactionQuote.valid = false;
      transactionQuote.invalidReason =
        'pool is disabled for transfer or splits, please withdraw max amounts allowed';
      return transactionQuote;
    }
    return transactionQuote;
  }

  private static selectSorted<C extends CommitmentLike>(
    commitments: C[],
    numInputs: number,
    amount: BN,
    exactMatch = false,
  ): C[] {
    if (numInputs <= 0) {
      return [];
    }
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      if (
        (exactMatch && toBN(commitment.amount || 0).eq(amount)) ||
        (!exactMatch && toBN(commitment.amount || 0).gte(amount))
      ) {
        return [commitment];
      }
    }
    for (let i = 0; i < commitments.length; i += 1) {
      const commitment = commitments[i];
      const remainingAmount = amount.sub(toBN(commitment.amount || 0));
      const remainingCommitments = this.selectSorted(
        commitments.slice(i + 1),
        numInputs - 1,
        remainingAmount,
        exactMatch,
      );
      if (remainingCommitments.length > 0) {
        return [commitment, ...remainingCommitments];
      }
    }
    return [];
  }
}
