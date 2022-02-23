import { ethers } from 'ethers';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { AccountHandler } from './accountHandler.js';
import { ContractHandler } from './contractHandler.js';
import { check, fromDecimals, toBuff, toHexNoPrefix, toString, toBN } from '@mystiko/utils';
import {
  isValidPrivateNoteStatus,
  OffChainNote,
  PrivateNote,
  PrivateNoteStatus,
  ID_KEY,
  BridgeType,
  BaseModel,
} from '../model';
import { ProviderPool } from '../chain/provider.js';
import { ContractPool } from '../chain/contract';
import rootLogger from '../logger';

/**
 * @class NoteHandler
 * @extends Handler
 * @desc handler class for PrivateNote related business logic
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class NoteHandler extends Handler {
  constructor(walletHandler, accountHandler, contractHandler, providerPool, contractPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(accountHandler instanceof AccountHandler, 'accountHandler should be instance of AccountHandler');
    check(
      contractHandler instanceof ContractHandler,
      'contractHandler should be instance of ContractHandler',
    );
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.contractHandler = contractHandler;
    this.providerPool = providerPool;
    this.contractPool = contractPool;
    this.logger = rootLogger.getLogger('NoteHandler');
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
      return this.getPrivateNote(query.id);
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
    return this._getPrivateNotes({ filterFunc, sortBy, desc, offset, limit })
      .data()
      .map((rawObject) => new PrivateNote(rawObject));
  }

  /**
   * @desc group {@link PrivateNote} by the given group by field, with the specific reducer and filterOptions.
   * @param {string} groupBy the field name of this group by query.
   * @param {function} reducer a function which reduces an array of {@link PrivateNote} to a single value.
   * @param {Object} [filterOptions] options of filtering this group by, check {@link NoteHandler#getPrivateNotes}.
   * @returns {Array.<{groupName: string, reducedValue: *}>} an array of groups, each group contains
   * a group name and a reduced value.
   */
  groupPrivateNotes(groupBy, reducer, filterOptions = {}) {
    check(typeof groupBy === 'string', 'groupBy should be a string');
    check(typeof reducer === 'function', 'reducer should be a function');
    const distinctValues = new Set(
      this._getPrivateNotes(filterOptions)
        .data()
        .map((note) => note[groupBy]),
    );
    const groups = [];
    distinctValues.forEach((groupName) => {
      const filterFunc = (note) => {
        if (filterOptions.filterFunc) {
          return note[groupBy] === groupName && filterOptions.filterFunc(note);
        } else {
          return note[groupBy] === groupName;
        }
      };
      const newFilterOptions = { ...filterOptions, filterFunc };
      const groupValues = this._getPrivateNotes(newFilterOptions).data();
      const reducedValue = reducer(groupValues.map((note) => new PrivateNote(note)));
      groups.push({ groupName: toString(groupName), reducedValue });
    });
    return groups;
  }

  /**
   * @desc group private notes by destination asset symbols.
   * @param {Object} [filterOptions] options of filtering this group by, check {@link NoteHandler#getPrivateNotes}.
   * @returns {Array.<{dstAsset: string, count: number, total: number, unspent: number}>}
   * an array of groups, each group contains a dstAsset as asset symbol, a count represents the number of
   * private notes in this group, a total of all private notes amount, and the sum of unspent private notes amount.
   */
  groupPrivateNoteByDstAsset(filterOptions = {}) {
    const groupWithCounts = this.groupPrivateNotes('dstAsset', (notes) => notes.length, filterOptions);
    const groupWithTotals = this.groupPrivateNotes(
      'dstAsset',
      (notes) => {
        return notes.map((note) => note.simpleAmount).reduce((a, b) => a + b);
      },
      filterOptions,
    );
    const filterFunc = (note) => {
      if (filterOptions.filterFunc) {
        return note.status === PrivateNoteStatus.IMPORTED && filterOptions.filterFunc(note);
      } else {
        return note.status === PrivateNoteStatus.IMPORTED;
      }
    };
    const groupWithUnspent = this.groupPrivateNotes(
      'dstAsset',
      (notes) => {
        return notes.map((note) => note.simpleAmount).reduce((a, b) => a + b);
      },
      { ...filterOptions, filterFunc },
    );
    const groups = {};
    for (let i = 0; i < groupWithCounts.length; i++) {
      const count = this.getPrivateNotes({
        ...filterOptions,
        filterFunc: (note) => {
          return note.dstAsset === groupWithCounts[i].groupName && filterFunc(note);
        },
      }).length;
      groups[groupWithCounts[i].groupName] = {
        dstAsset: groupWithCounts[i].groupName,
        count,
        total: 0,
        unspent: 0,
      };
    }
    for (let i = 0; i < groupWithTotals.length; i++) {
      groups[groupWithTotals[i].groupName]['total'] = groupWithTotals[i].reducedValue;
    }
    for (let i = 0; i < groupWithUnspent.length; i++) {
      groups[groupWithUnspent[i].groupName]['unspent'] = groupWithUnspent[i].reducedValue;
    }
    return Object.values(groups).sort((a, b) => (a.dstAsset >= b.dstAsset ? 1 : -1));
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
    const oldStatus = privateNote.status;
    privateNote.status = status;
    this.db.notes.update(privateNote.data);
    await this.saveDatabase();
    this.logger.info(
      `successfully updated private note(id=${privateNote.id}) status from ${oldStatus} to ${status}`,
    );
    return privateNote;
  }

  /**
   * @desc update the withdrawal transaction hash of the given {@link PrivateNote}.
   * @param {number|string|PrivateNote} privateNote id or transaction hash or commitment hash or
   * instance of {@link PrivateNote}.
   * @param {string} withdrawTransactionHash the hash of withdrawal transaction.
   * @returns {Promise<PrivateNote>} a promise of updated {@link PrivateNote} instance.
   */
  async updateWithdrawTransactionHash(privateNote, withdrawTransactionHash) {
    privateNote = this.getPrivateNote(privateNote);
    check(privateNote, 'no given privateNote found');
    privateNote.withdrawTransactionHash = withdrawTransactionHash;
    this.db.notes.update(privateNote.data);
    await this.saveDatabase();
    return privateNote;
  }

  async getPoolBalance(privateNote) {
    privateNote = this.getPrivateNote(privateNote);
    check(privateNote, 'given privateNote does not exist');
    const contractConfig = this._getContractConfig(privateNote.dstChainId, privateNote.dstProtocolAddress);
    const wrappedContract = this.contractPool.getWrappedContract(
      privateNote.dstChainId,
      privateNote.dstProtocolAddress,
    );
    const amount = await wrappedContract.assetBalance();
    return fromDecimals(amount, contractConfig.assetDecimals);
  }

  async _createPrivateNoteFromTxReceipt(
    chainId,
    txReceipt,
    requireCheck = true,
    walletPassword = undefined,
    shieldedAddress = undefined,
  ) {
    const contractConfig = this._getContractConfig(chainId, txReceipt.to);
    const parsedEvents = this._parseDepositLog(txReceipt, contractConfig);
    check(parsedEvents['Deposit'], 'no deposit event in transaction logs');
    const { amount, commitmentHash, encryptedNote } = parsedEvents['Deposit'].args;
    let wallet;
    if (requireCheck) {
      check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
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
    privateNote.srcAssetDecimals = contractConfig.assetDecimals;
    privateNote.srcProtocolAddress = txReceipt.to;
    privateNote.amount = toBN(amount.toString());
    privateNote.bridge = contractConfig.bridgeType;
    if (contractConfig.bridgeType !== BridgeType.LOOP) {
      const peerContractConfig = this.contractHandler.getContract(
        contractConfig.peerChainId,
        contractConfig.peerContractAddress,
      );
      check(peerContractConfig, 'peerContractConfig does not exist');
      privateNote.dstChainId = contractConfig.peerChainId;
      privateNote.dstAsset = peerContractConfig.assetSymbol;
      privateNote.dstAssetAddress = peerContractConfig.assetAddress;
      privateNote.dstAssetDecimals = peerContractConfig.assetDecimals;
      privateNote.dstProtocolAddress = contractConfig.peerContractAddress;
    } else {
      privateNote.dstChainId = chainId;
      privateNote.dstTransactionHash = txReceipt.transactionHash;
      privateNote.dstAsset = contractConfig.assetSymbol;
      privateNote.dstAssetAddress = contractConfig.assetAddress;
      privateNote.dstAssetDecimals = contractConfig.assetDecimals;
      privateNote.dstProtocolAddress = txReceipt.to;
    }
    privateNote.commitmentHash = toBN(toHexNoPrefix(commitmentHash), 16);
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
    this.logger.info(`successfully created a private note(id=${privateNote.id})`);
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

  _getPrivateNotes({ filterFunc, sortBy, desc, offset, limit } = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject) => {
      if (filterFunc && filterFunc instanceof Function) {
        return rawObject.walletId === wallet.id && filterFunc(new PrivateNote(rawObject));
      }
      return rawObject.walletId === wallet.id;
    };
    let queryChain = this.db.notes.chain().where(whereClause);
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.sort((n1, n2) => {
        return BaseModel.columnComparator(
          new PrivateNote(n1),
          new PrivateNote(n2),
          sortBy,
          desc ? desc : false,
        );
      });
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain;
  }

  async _updatePrivateNote(note) {
    this.db.notes.update(note.data);
    await this.saveDatabase();
    this.logger.info(`privateNote(id=${note.id}) has been updated`);
    return note;
  }

  _getContractConfig(chainId, address) {
    const contractConfig = this.contractHandler.getContract(chainId, address);
    check(contractConfig, 'contract config does not exist');
    return contractConfig;
  }
}
