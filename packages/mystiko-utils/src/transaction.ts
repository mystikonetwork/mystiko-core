import { ethers } from 'ethers';
import { EtherError } from './error';

export interface TransactionResponseLike {
  wait: (confirmations?: number) => Promise<ethers.providers.TransactionReceipt>;
}

export function waitTransaction(
  txResponse: TransactionResponseLike,
  confirmations?: number,
): Promise<ethers.providers.TransactionReceipt> {
  return txResponse.wait(confirmations).catch((error: Error) => {
    const etherError = error as EtherError;
    if (etherError.code === ethers.errors.TRANSACTION_REPLACED && etherError.receipt) {
      return Promise.resolve(etherError.receipt);
    }
    throw error;
  });
}
