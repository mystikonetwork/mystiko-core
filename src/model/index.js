import { BaseModel, ID_KEY } from './common.js';
import { Account } from './account.js';
import { Deposit, DepositStatus, isValidDepositStatus } from './deposit.js';
import { OffChainNote, PrivateNote, PrivateNoteStatus, isValidPrivateNoteStatus } from './note.js';
import { Wallet } from './wallet.js';
import { Withdraw, WithdrawStatus, isValidWithdrawStatus } from './withdraw.js';

export default {
  ID_KEY,
  BaseModel,
  Account,
  Deposit,
  DepositStatus,
  OffChainNote,
  PrivateNote,
  PrivateNoteStatus,
  Wallet,
  Withdraw,
  WithdrawStatus,
  isValidDepositStatus,
  isValidPrivateNoteStatus,
  isValidWithdrawStatus,
};
