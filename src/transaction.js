import { BigNumber } from 'bignumber.js';
import { randomBytes } from 'crypto';
import { pedersenHash } from 'circomlib';
import { Account } from './account.js';
import { bnToFixedBytes } from './utils.js';

export const RANDOM_SECRET_LEN = 16;
export const RANDOM_TRAPDOOR_R_LEN = 16;
export const RANDOM_TRAPDOOR_S_LEN = 16;

export class DepositTransaction {
  constructor(web3, contract, amount, shieldedAddress) {
    if (!(contract instanceof web3.eth.Contract)) {
      throw 'invalid contract instance, it should be web3.eth.Contract';
    }
    if (!(amount instanceof BigNumber)) {
      throw 'invalid amount instance, it should be BigNumber';
    }
    if (!Account.isValidAddress(shieldedAddress)) {
      throw 'invalid shieldedAddress, ' + shieldedAddress;
    }
    this.web3 = web3;
    this.contract = contract;
    this.amount = amount;
    this.shieldedAddress = shieldedAddress;
    const keys = Account.getPublicKeys(this.shieldedAddress);
    this.verifyPublicKey = keys[0];
    this.encPublicKey = keys[1];
  }

  send(options = {}) {
    const randomSecret = randomBytes(RANDOM_SECRET_LEN);
    const randomTrapdoorR = randomBytes(RANDOM_TRAPDOOR_R_LEN);
    const randomTrapdoorS = randomBytes(RANDOM_TRAPDOOR_S_LEN);
    const amountBytes = bnToFixedBytes(this.amount);
    const k = Buffer.from(
      pedersenHash.hash(Buffer.concat(this.verifyPublicKey, randomSecret, randomTrapdoorR)),
    );
    const commitmentHash = Buffer.from(pedersenHash.hash(Buffer.concat(amountBytes, k, randomTrapdoorS)));
    const encryptedNote = Account.encrypt(
      this.encPublicKey,
      Buffer.concat([amountBytes, randomSecret, randomTrapdoorR, randomTrapdoorS]),
    );
    return this.contract.methods
      .deposit(
        '0x' + this.amount.toString(16),
        '0x' + commitmentHash.toString('hex'),
        '0x' + encryptedNote.toString('hex'),
      )
      .send(options);
  }
}

export class WithdrawTransaction {
  constructor(srcWeb3, srcContract, dstWeb3, dstContract, shieldedAccount, commitmentHash, spendingAddress) {
    this.srcWeb3 = srcWeb3;
    this.srcContract = srcContract;
    this.dstWeb3 = dstWeb3;
    this.dstContract = dstContract;
    this.shieldedAccount = shieldedAccount;
    this.commitmentHash = commitmentHash;
    this.spendingAddress = spendingAddress;
  }
}
