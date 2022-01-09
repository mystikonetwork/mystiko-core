import { hdkey } from 'ethereumjs-wallet';
import { randomBytes } from 'crypto';
import { Account } from './account.js';

export class Wallet {
  constructor(masterSeed) {
    if (masterSeed == null || masterSeed == undefined) {
      masterSeed = randomBytes(32);
    }
    this.masterWallet = hdkey.fromMasterSeed(masterSeed);
    this.accounts = [];
    this.accountMap = {};
    this.keyNonce = 0;
  }

  addAccount(account = null) {
    if (account != null && account instanceof Account) {
      this.accounts.push(account);
      this.accountMap[account.address] = account;
    } else {
      let verifyPrivateKey = null;
      if (this.keyNonce === 0) {
        verifyPrivateKey = this.masterWallet.getWallet().getPrivateKey();
      } else {
        verifyPrivateKey = this.masterWallet.deriveChild(this.keyNonce).getWallet().getPrivateKey();
      }
      this.keyNonce = this.keyNonce + 1;
      const encPrivateKey = this.masterWallet.deriveChild(this.keyNonce).getWallet().getPrivateKey();
      this.keyNonce = this.keyNonce + 1;
      const newAccount = new Account(verifyPrivateKey, encPrivateKey);
      this.accounts.push(newAccount);
      this.accountMap[account.address] = newAccount;
    }
  }
}
