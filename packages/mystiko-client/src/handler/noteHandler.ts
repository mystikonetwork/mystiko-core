import { ethers } from 'ethers';
import { BridgeType, MystikoConfig } from '@mystiko/config';
import {
  check,
  fromDecimals,
  toBuff,
  toHexNoPrefix,
  toString,
  toBN,
  logger as rootLogger,
} from '@mystiko/utils';
import { Handler } from './handler';
import { WalletHandler } from './walletHandler';
import { AccountHandler } from './accountHandler';
import { ContractHandler } from './contractHandler';
import {
  isValidPrivateNoteStatus,
  DepositReceipt,
  PrivateNote,
  PrivateNoteStatus,
  ID_KEY,
  BaseModel,
  Contract,
} from '../model';
import { ProviderPool, ContractPool } from '../chain';
import { MystikoDatabase } from '../database';

interface QueryParams {
  filterFunc?: (item: PrivateNote) => boolean;
  sortBy?: string;
  desc?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * @class NoteHandler
 * @extends Handler
 * @desc handler class for PrivateNote related business logic
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class NoteHandler extends Handler {
  private readonly walletHandler: WalletHandler;

  private readonly accountHandler: AccountHandler;

  private readonly contractHandler: ContractHandler;

  private readonly providerPool: ProviderPool;

  private readonly contractPool: ContractPool;

  constructor(
    walletHandler: WalletHandler,
    accountHandler: AccountHandler,
    contractHandler: ContractHandler,
    providerPool: ProviderPool,
    contractPool: ContractPool,
    db: MystikoDatabase,
    config?: MystikoConfig,
  ) {
    super(db, config);
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.contractHandler = contractHandler;
    this.providerPool = providerPool;
    this.contractPool = contractPool;
    this.logger = rootLogger.getLogger('NoteHandler');
  }

  /**
   * @desc import a {@link PrivateNote} instance from {@link DepositReceipt} instance of serialized JSON string.
   * @param {string} walletPassword the password of the current running wallet.
   * @param {string|DepositReceipt} offChainNote off-chain private note as a serialized JSON string or an instance of
   * {@link DepositReceipt}.
   * @returns {Promise<PrivateNote | undefined>} a promise of imported {@link PrivateNote}.
   * @throws {Error} if the given wallet password is incorrect or the given off-chain note contains invalid
   * transaction data.
   */
  public async importFromOffChainNote(
    walletPassword: string,
    offChainNote: string | DepositReceipt,
  ): Promise<PrivateNote> {
    let receipt: DepositReceipt;
    if (typeof offChainNote === 'string') {
      receipt = new DepositReceipt(JSON.parse(offChainNote));
    } else {
      receipt = offChainNote;
    }
    if (receipt.chainId && receipt.transactionHash) {
      const provider = this.providerPool.getProvider(receipt.chainId);
      if (provider) {
        const txReceipt = await provider.getTransactionReceipt(receipt.transactionHash);
        check(!!txReceipt, `${receipt.transactionHash} does not exist or not confirmed`);
        return this.createPrivateNoteFromTxReceipt(receipt.chainId, txReceipt, true, walletPassword);
      }
    }
    return Promise.reject(new Error(`invalid deposit receipt ${offChainNote.toString()}`));
  }

  /**
   * @desc get a {@link PrivateNote} instance from the given query.
   * @param {number | string | PrivateNote} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link PrivateNote#srcTransactionHash} or
   * {@link PrivateNote#dstTransactionHash} or {@link PrivateNote#commitmentHash}. If the query is an instance of
   * {@link PrivateNote}, it just returns that instance.
   * @returns {PrivateNote | undefined} the found instance of {@link PrivateNote}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  public getPrivateNote(query: number | string | PrivateNote): PrivateNote | undefined {
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
    } else if (query.id) {
      return this.getPrivateNote(query.id);
    }
    return privateNote ? new PrivateNote(privateNote) : undefined;
  }

  /**
   * @desc get an array of {@link PrivateNote} with the given filtering/sorting/pagination criteria.
   * @param {QueryParams} [queryParams={}] an object contains the search criteria.
   * @param {Function} [queryParams.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link PrivateNote}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [queryParams.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [queryParams.desc] whether the returned array should be sorted in descending order.
   * @param {number} [queryParams.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [queryParams.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {PrivateNote[]} an array of {@link PrivateNote} which meets the search criteria.
   */
  public getPrivateNotes(queryParams: QueryParams = {}): PrivateNote[] {
    return this.getPrivateNotesResultSet(queryParams)
      .data()
      .map((rawObject) => new PrivateNote(rawObject));
  }

  /**
   * @desc group {@link PrivateNote} by the given group by field, with the specific reducer and filterOptions.
   * @param {string} groupBy the field name of this group by query.
   * @param {function} reducer a function which reduces an array of {@link PrivateNote} to a single value.
   * @param {QueryParams} [queryParams] options of filtering this group by, check {@link NoteHandler#getPrivateNotes}.
   * @returns {Array.<{groupName: string, reducedValue: *}>} an array of groups, each group contains
   * a group name and a reduced value.
   */
  public groupPrivateNotes(
    groupBy: string,
    reducer: (notes: PrivateNote[]) => any,
    queryParams: QueryParams = {},
  ): { groupName: string; reducedValue: any }[] {
    const distinctValues = new Set(
      this.getPrivateNotesResultSet(queryParams)
        .data()
        .map((note) => note[groupBy]),
    );
    const groups: { groupName: string; reducedValue: any }[] = [];
    distinctValues.forEach((groupName) => {
      const filterFunc = (note: PrivateNote) => {
        if (queryParams.filterFunc) {
          return (note as { [key: string]: any })[groupBy] === groupName && queryParams.filterFunc(note);
        }
        return (note as { [key: string]: any })[groupBy] === groupName;
      };
      const newQueryParams = { ...queryParams, filterFunc };
      const groupValues = this.getPrivateNotesResultSet(newQueryParams).data();
      const reducedValue = reducer(groupValues.map((note) => new PrivateNote(note)));
      groups.push({ groupName: toString(groupName), reducedValue });
    });
    return groups;
  }

  /**
   * @desc group private notes by destination asset symbols.
   * @param {QueryParams} [queryParams] options of filtering this group by, check {@link NoteHandler#getPrivateNotes}.
   * @returns {Array.<{dstAsset: string, count: number, total: number, unspent: number}>}
   * an array of groups, each group contains a dstAsset as asset symbol, a count represents the number of
   * private notes in this group, a total of all private notes amount, and the sum of unspent private notes amount.
   */
  public groupPrivateNoteByDstAsset(
    queryParams: QueryParams = {},
  ): { dstAsset: string; count: number; total: number; unspent: number }[] {
    const groupWithCounts = this.groupPrivateNotes('dstAsset', (notes) => notes.length, queryParams);
    const groupWithTotals = this.groupPrivateNotes(
      'dstAsset',
      (notes) => notes.map((note) => note.simpleAmount).reduce((a, b) => (a || 0) + (b || 0)),
      queryParams,
    );
    const filterFunc = (note: PrivateNote) => {
      if (queryParams.filterFunc) {
        return note.status === PrivateNoteStatus.IMPORTED && queryParams.filterFunc(note);
      }
      return note.status === PrivateNoteStatus.IMPORTED;
    };
    const groupWithUnspent = this.groupPrivateNotes(
      'dstAsset',
      (notes) => notes.map((note) => note.simpleAmount).reduce((a, b) => (a || 0) + (b || 0)),
      { ...queryParams, filterFunc },
    );
    const groups: { [key: string]: { dstAsset: string; count: number; total: number; unspent: number } } = {};
    for (let i = 0; i < groupWithCounts.length; i += 1) {
      const count = this.getPrivateNotes({
        ...queryParams,
        filterFunc: (note) => note.dstAsset === groupWithCounts[i].groupName && filterFunc(note),
      }).length;
      groups[groupWithCounts[i].groupName] = {
        dstAsset: groupWithCounts[i].groupName,
        count,
        total: 0,
        unspent: 0,
      };
    }
    for (let i = 0; i < groupWithTotals.length; i += 1) {
      const { groupName } = groupWithTotals[i];
      groups[groupName] = { ...groups[groupName], total: groupWithTotals[i].reducedValue };
    }
    for (let i = 0; i < groupWithUnspent.length; i += 1) {
      const { groupName } = groupWithUnspent[i];
      groups[groupName] = { ...groups[groupName], unspent: groupWithUnspent[i].reducedValue };
    }
    return Object.values(groups).sort((a, b) => (a.dstAsset >= b.dstAsset ? 1 : -1));
  }

  /**
   * @desc update the status of the given {@link PrivateNote}.
   * @param {number | string | PrivateNote} privateNote id or transaction hash or commitment hash or
   * instance of {@link PrivateNote}.
   * @param {PrivateNoteStatus} status the status to be updated to.
   * @returns {Promise<PrivateNote>} a promise of updated {@link PrivateNote} instance.
   */
  public async updateStatus(
    privateNote: number | string | PrivateNote,
    status: PrivateNoteStatus,
  ): Promise<PrivateNote> {
    check(isValidPrivateNoteStatus(status), 'invalid private note status');
    const wrappedPrivateNote = this.getPrivateNote(privateNote);
    if (wrappedPrivateNote) {
      const oldStatus = wrappedPrivateNote.status;
      wrappedPrivateNote.status = status;
      this.db.notes.update(wrappedPrivateNote.data);
      await this.saveDatabase();
      this.logger.info(
        `successfully updated private note(id=${wrappedPrivateNote.id}) status from ${oldStatus} to ${status}`,
      );
      return wrappedPrivateNote;
    }
    throw new Error(`private note ${privateNote.toString()} does not exist`);
  }

  /**
   * @desc update the withdrawal transaction hash of the given {@link PrivateNote}.
   * @param {number | string | PrivateNote} privateNote id or transaction hash or commitment hash or
   * instance of {@link PrivateNote}.
   * @param {string} withdrawTransactionHash the hash of withdrawal transaction.
   * @returns {Promise<PrivateNote>} a promise of updated {@link PrivateNote} instance.
   */
  public updateWithdrawTransactionHash(
    privateNote: number | string | PrivateNote,
    withdrawTransactionHash: string,
  ): Promise<PrivateNote> {
    const wrappedPrivateNote = this.getPrivateNote(privateNote);
    if (wrappedPrivateNote) {
      wrappedPrivateNote.withdrawTransactionHash = withdrawTransactionHash;
      return this.updatePrivateNote(wrappedPrivateNote);
    }
    return Promise.reject(new Error(`private note ${privateNote.toString()} does not exist`));
  }

  public async updatePrivateNote(note: PrivateNote): Promise<PrivateNote> {
    this.db.notes.update(note.data);
    await this.saveDatabase();
    this.logger.info(`privateNote(id=${note.id}) has been updated`);
    return note;
  }

  public async getPoolBalance(privateNote: number | string | PrivateNote): Promise<number | undefined> {
    const wrappedPrivateNote = this.getPrivateNote(privateNote);
    if (wrappedPrivateNote) {
      if (wrappedPrivateNote.dstChainId && wrappedPrivateNote.dstProtocolAddress) {
        const contractConfig = this.contractHandler.getContract(
          wrappedPrivateNote.dstChainId,
          wrappedPrivateNote.dstProtocolAddress,
        );
        const wrappedContract = this.contractPool.getWrappedContract(
          wrappedPrivateNote.dstChainId,
          wrappedPrivateNote.dstProtocolAddress,
        );
        if (wrappedContract && contractConfig) {
          const amount = await wrappedContract.assetBalance();
          return fromDecimals(amount, contractConfig.assetDecimals);
        }
      }
    }
    return undefined;
  }

  public async createPrivateNoteFromTxReceipt(
    chainId: number,
    txReceipt: ethers.providers.TransactionReceipt,
    requireCheck: boolean = true,
    walletPassword?: string,
    shieldedAddress?: string,
  ): Promise<PrivateNote> {
    const contractConfig = this.contractHandler.getContract(chainId, txReceipt.to);
    if (!contractConfig) {
      throw new Error(`contract ${txReceipt.to} does not in exist in local configuration`);
    }
    const parsedEvents = NoteHandler.parseDepositLog(txReceipt, contractConfig);
    check(!!parsedEvents.Deposit, 'no deposit event in transaction logs');
    const { amount, commitmentHash, encryptedNote } = parsedEvents.Deposit.args;
    let wallet;
    let wrappedShieldedAddress;
    if (requireCheck) {
      if (!walletPassword) {
        throw new Error('wallet password cannot be empty');
      }
      check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
      wallet = this.walletHandler.checkCurrentWallet();
      wrappedShieldedAddress = await this.tryDecryptOnChainNote(walletPassword, encryptedNote);
      check(!!wrappedShieldedAddress, 'this deposit does not belong to your accounts');
    } else {
      wallet = this.walletHandler.checkCurrentWallet();
      wrappedShieldedAddress = shieldedAddress;
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
      if (!contractConfig.peerChainId || !contractConfig.peerContractAddress) {
        throw new Error(
          `contract ${contractConfig.address} does not contain peerChainId or peerContractAddress`,
        );
      }
      const peerContractConfig = this.contractHandler.getContract(
        contractConfig.peerChainId,
        contractConfig.peerContractAddress,
      );
      if (!peerContractConfig) {
        throw new Error(
          `peer contract ${contractConfig.peerContractAddress} does not exist in local database`,
        );
      }
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
    privateNote.shieldedAddress = wrappedShieldedAddress;
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

  private async tryDecryptOnChainNote(
    password: string,
    encryptedOnChainNote: string,
  ): Promise<string | undefined> {
    const accounts = this.accountHandler.getAccounts();
    const promises: Promise<string | undefined>[] = [];
    for (let i = 0; i < accounts.length; i += 1) {
      const account = accounts[i];
      if (account.encryptedEncSecretKey) {
        const skEnc = this.protocol.decryptSymmetric(password, account.encryptedEncSecretKey);
        const promise = this.protocol
          .decryptAsymmetric(toBuff(skEnc), toBuff(encryptedOnChainNote))
          .then(() => account.shieldedAddress)
          .catch(() => undefined);
        promises.push(promise);
      }
    }
    const allAddresses = await Promise.all(promises);
    for (let i = 0; i < allAddresses.length; i += 1) {
      if (allAddresses[i]) {
        return allAddresses[i];
      }
    }
    return undefined;
  }

  private getPrivateNotesResultSet(queryParams: QueryParams = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const { filterFunc, sortBy, desc, offset, limit } = queryParams;
    const whereClause = (rawObject: Object) => {
      const privateNote = new PrivateNote(rawObject);
      if (filterFunc) {
        return privateNote.walletId === wallet.id && filterFunc(privateNote);
      }
      return privateNote.walletId === wallet.id;
    };
    let queryChain = this.db.notes.chain().where(whereClause);
    if (sortBy) {
      queryChain = queryChain.sort((n1, n2) =>
        BaseModel.columnComparator(new PrivateNote(n1), new PrivateNote(n2), sortBy, desc || false),
      );
    }
    if (offset) {
      queryChain = queryChain.offset(offset);
    }
    if (limit) {
      queryChain = queryChain.limit(limit);
    }
    return queryChain;
  }

  private static parseDepositLog(
    txReceipt: ethers.providers.TransactionReceipt,
    contractConfig: Contract,
  ): { [key: string]: ethers.utils.LogDescription } {
    const parsedEvents: { [key: string]: ethers.utils.LogDescription } = {};
    if (contractConfig.abi) {
      const contract = new ethers.utils.Interface(contractConfig.abi);
      for (let i = 0; i < txReceipt.logs.length; i += 1) {
        try {
          const parsedEvent = contract.parseLog(txReceipt.logs[i]);
          parsedEvents[parsedEvent.name] = parsedEvent;
        } catch {
          // do nothing
        }
      }
    }
    return parsedEvents;
  }
}
