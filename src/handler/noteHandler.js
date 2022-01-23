import { ethers } from 'ethers';
import BN from 'bn.js';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { AccountHandler } from './accountHandler.js';
import { check, toBuff, toHexNoPrefix } from '../utils.js';
import {
  isValidPrivateNoteStatus,
  OffChainNote,
  PrivateNote,
  PrivateNoteStatus,
  ID_KEY,
  BridgeType,
} from '../model';
import { ProviderPool } from '../chain/provider.js';

/**
 * @class NoteHandler
 * @extends Handler
 * @desc handler class for PrivateNote related business logic
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class NoteHandler extends Handler {
  constructor(walletHandler, accountHandler, providerPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(accountHandler instanceof AccountHandler, 'accountHandler should be instance of AccountHandler');
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.providerPool = providerPool;
  }

  /**
   * @desc import a {@link PrivateNote} instance from {@link OffChainNote} instance of serialized JSON string.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {string|OffChainNote} offChainNote off-chain private note as a serialized JSON string or an instance of
   * {@link OffChainNote}.
   * @returns {Promise<PrivateNote>} a promise of imported {@link PrivateNote}.
   * @throws {Error} if the given wallet password is incorrect or the given off-chain note contains invalid
   * transaction data.
   */
  async importFromOffChainNote(walletPassword, offChainNote) {
    if (typeof offChainNote === 'string') {
      offChainNote = new OffChainNote(JSON.parse(offChainNote));
    } else {
      check(offChainNote instanceof OffChainNote, 'offChainNote should be instance of OffChainNote');
    }
    const provider = this.providerPool.getProvider(offChainNote.chainId);
    const txReceipt = await provider.getTransactionReceipt(offChainNote.transactionHash);
    check(txReceipt, `${offChainNote.transactionHash} does not exist or not confirmed`);
    return this._createPrivateNoteFromTxReceipt(offChainNote.chainId, txReceipt, true, walletPassword);
  }

  /**
   * @desc get a {@link PrivateNote} instance from the given query.
   * @param {number|string|PrivateNote} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link PrivateNote#srcTransactionHash} or
   * {@link PrivateNote#dstTransactionHash} or {@link PrivateNote#commitmentHash}. If the query is an instance of
   * {@link PrivateNote}, it just returns that instance.
   * @returns {PrivateNote|undefined} the found instance of {@link PrivateNote}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  getPrivateNote(query) {
    let privateNote;
    if (typeof query === 'number') {
      privateNote = this.db.notes.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string') {
      privateNote = this.db.notes.findOne({ srcTransactionHash: query });
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ dstTransactionHash: query });
      }
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ commitmentHash: query });
      }
      if (!privateNote) {
        privateNote = this.db.notes.findOne({ encryptedOnChainNote: query });
      }
    } else if (query instanceof PrivateNote) {
      return query;
    }
    return privateNote ? new PrivateNote(privateNote) : undefined;
  }

  /**
   * @desc get an array of {@link PrivateNote} with the given filtering/sorting/pagination criteria.
   * @param {object} [options={}] an object contains the search criteria.
   * @param {Function} [options.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link PrivateNote}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [options.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [options.desc] whether the returned array should be sorted in descending order.
   * @param {number} [options.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [options.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {PrivateNote[]} an array of {@link PrivateNote} which meets the search criteria.
   */
  getPrivateNotes({ filterFunc, sortBy, desc, offset, limit } = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject) => {
      if (filterFunc && filterFunc instanceof Function) {
        return rawObject.walletId === wallet.id && filterFunc(new PrivateNote(rawObject));
      }
      return rawObject.walletId === wallet.id;
    };
    let queryChain = this.db.notes.chain().where(whereClause);
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new PrivateNote(rawObject));
  }

  /**
   * @desc update the status of the given {@link PrivateNote}.
   * @param {number|string|PrivateNote} privateNote id or transaction hash or commitment hash or
   * instance of {@link PrivateNote}.
   * @param {PrivateNoteStatus} status the status to be updated to.
   * @returns {Promise<PrivateNote>} a promise of updated {@link PrivateNote} instance.
   */
  async updateStatus(privateNote, status) {
    check(isValidPrivateNoteStatus(status), 'invalid private note status');
    privateNote = this.getPrivateNote(privateNote);
    check(privateNote, 'no given privateNote found');
    privateNote.status = status;
    this.db.notes.update(privateNote.data);
    await this.saveDatabase();
    return privateNote;
  }

  async _createPrivateNoteFromTxReceipt(
    chainId,
    txReceipt,
    requireCheck = true,
    walletPassword = undefined,
    shieldedAddress = undefined,
  ) {
    const chainConfig = this.config.getChainConfig(chainId);
    const contractConfig = chainConfig.getContract(txReceipt.to);
    const parsedEvents = this._parseDepositLog(txReceipt, contractConfig);
    check(parsedEvents['Deposit'], 'no deposit event in transaction logs');
    const { amount, commitmentHash, encryptedNote } = parsedEvents['Deposit'].args;
    let wallet;
    if (requireCheck) {
      this.walletHandler.checkPassword(walletPassword);
      wallet = this.walletHandler.getCurrentWallet();
      shieldedAddress = await this._tryDecryptOnChainNote(walletPassword, encryptedNote);
      check(shieldedAddress, 'this deposit does not belong to your accounts');
    } else {
      wallet = this.walletHandler.checkCurrentWallet();
    }
    const privateNote = new PrivateNote();
    privateNote.srcChainId = chainId;
    privateNote.srcTransactionHash = txReceipt.transactionHash;
    privateNote.srcAsset = contractConfig.assetSymbol;
    privateNote.srcAssetAddress = contractConfig.assetAddress;
    privateNote.srcProtocolAddress = txReceipt.to;
    privateNote.amount = new BN(amount.toString());
    privateNote.bridge = contractConfig.bridgeType;
    if (contractConfig.bridgeType !== BridgeType.LOOP) {
      const peerChainConfig = this.config.getChainConfig(contractConfig.peerChainId);
      const peerContractConfig = peerChainConfig.getContract(contractConfig.peerContractAddress);
      privateNote.dstChainId = contractConfig.peerChainId;
      privateNote.dstAsset = peerContractConfig.assetSymbol;
      privateNote.dstAssetAddress = peerContractConfig.assetAddress;
      privateNote.dstProtocolAddress = contractConfig.peerContractAddress;
    } else {
      privateNote.dstChainId = chainId;
      privateNote.dstTransactionHash = txReceipt.transactionHash;
      privateNote.dstAsset = contractConfig.assetSymbol;
      privateNote.dstAssetAddress = contractConfig.assetAddress;
      privateNote.dstProtocolAddress = txReceipt.to;
    }
    privateNote.commitmentHash = new BN(toHexNoPrefix(commitmentHash), 16);
    privateNote.encryptedOnChainNote = toBuff(encryptedNote);
    privateNote.walletId = wallet.id;
    privateNote.shieldedAddress = shieldedAddress;
    privateNote.status = PrivateNoteStatus.IMPORTED;
    const existingOne = this.db.notes.findOne({
      srcChainId: privateNote.srcChainId,
      commitmentHash: privateNote.commitmentHash.toString(),
    });
    check(!existingOne, 'duplicate notes');
    this.db.notes.insert(privateNote.data);
    await this.saveDatabase();
    return privateNote;
  }

  _parseDepositLog(txReceipt, contractConfig) {
    check(contractConfig, `can't recognize contract address ${txReceipt.to}`);
    const contract = new ethers.utils.Interface(contractConfig.abi);
    const parsedEvents = {};
    for (let i = 0; i < txReceipt.logs.length; i++) {
      try {
        const parsedEvent = contract.parseLog(txReceipt.logs[i]);
        parsedEvents[parsedEvent.name] = parsedEvent;
      } catch {
        // do nothing
      }
    }
    return parsedEvents;
  }

  async _tryDecryptOnChainNote(password, encryptedOnChainNote) {
    const accounts = this.accountHandler.getAccounts();
    for (let i = 0; i < accounts.length; i++) {
      const skEnc = this.protocol.decryptSymmetric(password, accounts[i].encryptedEncSecretKey);
      try {
        await this.protocol.decryptAsymmetric(toBuff(skEnc), toBuff(encryptedOnChainNote));
        return accounts[i].shieldedAddress;
      } catch {
        // do nothing
      }
    }
    return undefined;
  }
}
