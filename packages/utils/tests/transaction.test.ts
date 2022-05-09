import { ethers } from 'ethers';
import { EtherError, TransactionResponseLike, waitTransaction } from '../src';

class MockTransaction implements TransactionResponseLike {
  private readonly error?: Error;

  private readonly shouldReplace: boolean;

  private readonly originalTxReceipt: ethers.providers.TransactionReceipt;

  private readonly replacedTxReceipt?: ethers.providers.TransactionReceipt;

  constructor(
    originalTxReceipt: ethers.providers.TransactionReceipt,
    replacedTxReceipt?: ethers.providers.TransactionReceipt,
    shouldReplace?: boolean,
    error?: Error,
  ) {
    this.error = error;
    this.originalTxReceipt = originalTxReceipt;
    this.replacedTxReceipt = replacedTxReceipt;
    this.shouldReplace = shouldReplace || false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public wait(confirmations?: number): Promise<ethers.providers.TransactionReceipt> {
    if (this.error) {
      if (this.shouldReplace) {
        const error = new Error();
        (error as EtherError).code = ethers.errors.TRANSACTION_REPLACED;
        (error as EtherError).receipt = this.replacedTxReceipt;
        return Promise.reject(error);
      }
      return Promise.reject(this.error);
    }
    return Promise.resolve(this.originalTxReceipt);
  }
}

test('test waitTransaction', async () => {
  const case1 = new MockTransaction({
    transactionHash: '0x12e7909f206e3a83f5d5f066f649440fe518ae6c3011b25f3f834c37258b3997',
  } as ethers.providers.TransactionReceipt);
  expect((await waitTransaction(case1)).transactionHash).toBe(
    '0x12e7909f206e3a83f5d5f066f649440fe518ae6c3011b25f3f834c37258b3997',
  );
  const case2 = new MockTransaction(
    {
      transactionHash: '0x663acbbce78801a4c36ee54291e08f40a4831e6246cbf00c761727d60c0efb23',
    } as ethers.providers.TransactionReceipt,
    undefined,
    false,
    new Error('random'),
  );
  await expect(waitTransaction(case2)).rejects.toThrow(new Error('random'));
  const case3 = new MockTransaction(
    {
      transactionHash: '0x12e7909f206e3a83f5d5f066f649440fe518ae6c3011b25f3f834c37258b3997',
    } as ethers.providers.TransactionReceipt,
    {
      transactionHash: '0x663acbbce78801a4c36ee54291e08f40a4831e6246cbf00c761727d60c0efb23',
    } as ethers.providers.TransactionReceipt,
    true,
    new Error('random'),
  );
  expect((await waitTransaction(case3)).transactionHash).toBe(
    '0x663acbbce78801a4c36ee54291e08f40a4831e6246cbf00c761727d60c0efb23',
  );
});
