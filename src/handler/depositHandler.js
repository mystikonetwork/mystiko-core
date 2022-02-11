import BN from 'bn.js';

import { Handler } from './handler.js';
import { check, toHex, toDecimals, toFixedLenHex, toString, errorMessage } from '../utils.js';
import { ContractPool } from '../chain/contract.js';
import { WalletHandler } from './walletHandler.js';
import { AccountHandler } from './accountHandler.js';
import { NoteHandler } from './noteHandler.js';
import { checkSigner } from '../chain/signer.js';
import { Deposit, DepositStatus, AssetType, BridgeType, ID_KEY, OffChainNote, BaseModel } from '../model';
import rootLogger from '../logger';

/**
 * @class DepositHandler
 * @extends Handler
 * @desc handler class for Deposit related business logic.
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {NoteHandler} noteHandler instance of {@link NoteHandler}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class DepositHandler extends Handler {
  constructor(walletHandler, accountHandler, noteHandler, contractPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(accountHandler instanceof AccountHandler, 'accountHandler should be instance of AccountHandler');
    check(noteHandler instanceof NoteHandler, 'noteHandler should be instance of NoteHandler');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.noteHandler = noteHandler;
    this.contractPool = contractPool;
    this.logger = rootLogger.getLogger('DepositHandler');
  }

  /**
   * @desc create a deposit transaction based on the user's request.
   * @param {Object} request the request object.
   * @param {number} request.srcChainId the source chain id which this deposit will be sent from.
   * @param {number} request.dstChainId the destination chain id which this deposit will be sent to.
   * @param {string} request.assetSymbol the symbol of asset this deposit will operate.
   * @param {module:mystiko/models.BridgeType} request.bridge the cross-chain bridge type which this deposit will
   * use to do cross-chain. If this is same-chain deposit/withdraw, you should set 'loop' as value.
   * @param {number} request.amount the amount of asset this deposit will operate.
   * @param {string} request.shieldedAddress the recipient shielded address which is used to protect the privacy of
   * this deposit transaction.
   * @param {BaseSigner} signer the instance of {@link BaseSigner} to sign the deposit transaction.
   * @param {Function} [statusCallback] a callback function that will be called when the status of
   * the deposit transaction changes. It should be constructed like this:
   * (deposit: {@link Deposit}, oldStatus: {@link module:mystiko/models.DepositStatus}, newStatus: {@link module:mystiko/models.DepositStatus}) => {}
   * @returns {Promise<{depositPromise: Promise<void>, deposit: Deposit}>} a promise of an object which contains two
   * fields: deposit and depositPromise. the depositPromise will be resolved after the deposit transaction is confirmed
   * on the source chain. The deposit instance is immediately returned once the transaction is initialized.
   * If any error occurs during the transaction, the {@link Deposit#errorMessage} will be set to be non-undefined.
   * Please check the {@link Deposit#errorMessage} if you find {@link Deposit#status} is FAILED.
   */
  async createDeposit(
    { srcChainId, dstChainId, assetSymbol, bridge, amount, shieldedAddress },
    signer,
    statusCallback = undefined,
  ) {
    check(typeof amount === 'number', 'amount is invalid number');
    check(this.protocol.isShieldedAddress(shieldedAddress), 'invalid shielded address');
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, assetSymbol, bridge);
    const depositContracts = this.contractPool.getDepositContracts(
      srcChainId,
      dstChainId,
      assetSymbol,
      bridge,
    );
    await checkSigner(signer, srcChainId, this.config);
    const wallet = this.walletHandler.checkCurrentWallet();
    amount = toDecimals(amount, contractConfig.assetDecimals);
    const { commitmentHash, randomS, k, privateNote } = await this.protocol.commitmentWithShieldedAddress(
      shieldedAddress,
      amount,
    );
    const deposit = new Deposit();
    deposit.srcChainId = srcChainId;
    deposit.dstChainId = dstChainId;
    deposit.bridge = bridge;
    deposit.asset = assetSymbol;
    deposit.assetType = contractConfig.assetType;
    deposit.assetDecimals = contractConfig.assetDecimals;
    deposit.amount = amount;
    deposit.commitmentHash = commitmentHash;
    deposit.randomS = randomS;
    deposit.hashK = k;
    deposit.privateNote = privateNote;
    deposit.walletId = wallet.id;
    deposit.srcAddress = await signer.signer.getAddress();
    deposit.shieldedRecipientAddress = shieldedAddress;
    deposit.status = DepositStatus.INIT;
    this.db.deposits.insert(deposit.data);
    await this.saveDatabase();
    const depositPromise = this._approveAsset(signer, deposit, depositContracts, statusCallback)
      .then(() => {
        return this._sendDeposit(
          signer,
          deposit,
          depositContracts,
          contractConfig.assetType === AssetType.MAIN,
          statusCallback,
        );
      })
      .catch((error) => {
        deposit.errorMessage = errorMessage(error);
        this.logger.error(`deposit(id=${deposit.id}) transaction raised error: ${deposit.errorMessage}`);
        return this._updateDepositStatus(deposit, DepositStatus.FAILED, statusCallback);
      });
    this.logger.info(`successfully created a deposit(id=${deposit.id}), waiting on the transaction(s)...`);
    return { deposit: new Deposit(deposit), depositPromise };
  }

  /**
   * @desc get a {@link Deposit} instance from the given query.
   * @param {number|string|Deposit} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link Deposit#srcTxHash} or
   * {@link Deposit#dstTxHash} or {@link Deposit#bridgeTxHash}. If the query is an instance of
   * {@link Deposit}, it just returns that instance.
   * @returns {Deposit|undefined} the found instance of {@link Deposit}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  getDeposit(query) {
    let deposit;
    if (typeof query === 'number') {
      deposit = this.db.deposits.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string') {
      deposit = this.db.deposits.findOne({ srcTxHash: query });
      if (!deposit) {
        deposit = this.db.deposits.findOne({ dstTxHash: query });
      }
      if (!deposit) {
        deposit = this.db.deposits.findOne({ bridgeTxHash: query });
      }
    } else if (query instanceof Deposit) {
      return this.getDeposit(query.id);
    }
    return deposit ? new Deposit(deposit) : undefined;
  }

  /**
   * @desc get an array of {@link Deposit} with the given filtering/sorting/pagination criteria.
   * @param {object} [options={}] an object contains the search criteria.
   * @param {Function} [options.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Deposit}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [options.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [options.desc] whether the returned array should be sorted in descending order.
   * @param {number} [options.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [options.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Deposit[]} an array of {@link Deposit} which meets the search criteria.
   */
  getDeposits({ filterFunc, sortBy, desc, offset, limit } = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject) => {
      if (filterFunc && filterFunc instanceof Function) {
        return rawObject.walletId === wallet.id && filterFunc(new Deposit(rawObject));
      }
      return rawObject.walletId === wallet.id;
    };
    let queryChain = this.db.deposits.chain().where(whereClause);
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.sort((d1, d2) => {
        return BaseModel.columnComparator(new Deposit(d1), new Deposit(d2), sortBy, desc ? desc : false);
      });
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Deposit(rawObject));
  }

  /**
   * @desc get the count of matching {@link Deposit} in the database.
   * @param {Function} [filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Deposit}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @returns {number} the count of {@link Deposit} in the database.
   */
  getDepositsCount(filterFunc = undefined) {
    return this.getDeposits({ filterFunc }).length;
  }

  /**
   * @desc export an off-chain note based the deposit information.
   * @param {number|string|Deposit} depositQuery if the query is a number, it searches the database by using query
   * as id. If the query is string, it searches the database by using query as {@link Deposit#srcTxHash} or
   * {@link Deposit#dstTxHash} or {@link Deposit#bridgeTxHash}. If the query is an instance of
   * {@link Deposit}, it just returns that instance.
   * @returns {OffChainNote} the instance of {@link OffChainNote}.s
   */
  exportOffChainNote(depositQuery) {
    const deposit = this.getDeposit(depositQuery);
    check(deposit, `deposit ${depositQuery} does not exist`);
    check(deposit.srcTxHash, 'deposit has not been ready for exporting off-chain note');
    return new OffChainNote({ chainId: deposit.srcChainId, transactionHash: deposit.srcTxHash });
  }

  async _approveAsset(signer, deposit, { asset, protocol }, statusCallback) {
    if (asset) {
      const assetContract = asset.connect(signer.signer);
      const spenderAddress = protocol.address;
      const balance = await asset.balanceOf(deposit.srcAddress);
      check(deposit.amount.lte(new BN(toString(balance))), 'insufficient balance');
      const allowance = await asset.allowance(deposit.srcAddress, spenderAddress);
      const allowanceBN = new BN(allowance.toString());
      if (allowanceBN.lt(deposit.amount)) {
        this.logger.info(`start submitting asset approving transaction for deposit(id=${deposit.id})`);
        const txResponse = await assetContract.approve(protocol.address, deposit.amount.toString());
        this.logger.info(
          `asset approving transaction for deposit(id=${deposit.id}) is submitted ` +
            `with txHash='${txResponse.hash}', waiting for confirmation...`,
        );
        deposit.assetApproveTxHash = txResponse.hash;
        await this._updateDepositStatus(deposit, DepositStatus.ASSET_APPROVING, statusCallback);
        let newStatus = deposit.status;
        const txReceipt = await txResponse.wait();
        this.logger.info(`asset approving transaction for deposit(id=${deposit.id}) is confirmed on chain`);
        newStatus = DepositStatus.ASSET_APPROVED;
        deposit.assetApproveTxHash = txReceipt.transactionHash;
        return await this._updateDepositStatus(deposit, newStatus, statusCallback);
      }
    } else {
      const balance = await signer.signer.getBalance();
      check(deposit.amount.lte(new BN(toString(balance))), 'insufficient balance');
    }
    return await this._updateDepositStatus(deposit, DepositStatus.ASSET_APPROVED, undefined, statusCallback);
  }

  async _sendDeposit(signer, deposit, depositContracts, isMainAsset, statusCallback) {
    check(deposit.status === DepositStatus.ASSET_APPROVED, 'token not approved');
    const protocolContract = await depositContracts.protocol.connect(signer.signer);
    this.logger.info(`start submitting deposit transaction for deposit(id=${deposit.id})`);
    const depositTxResponse = await protocolContract.deposit(
      deposit.amount.toString(),
      toFixedLenHex(deposit.commitmentHash),
      toFixedLenHex(deposit.hashK),
      toFixedLenHex(deposit.randomS, this.protocol.RANDOM_SK_SIZE),
      toHex(deposit.privateNote),
      { value: isMainAsset ? deposit.amount.toString() : '0' },
    );
    this.logger.info(
      `deposit transaction for deposit(id=${deposit.id}) is submitted ` +
        `with txHash='${depositTxResponse.hash}', waiting for confirmation...`,
    );
    deposit.srcTxHash = depositTxResponse.hash;
    await this._updateDepositStatus(deposit, DepositStatus.SRC_PENDING, statusCallback);
    let newStatus = deposit.status;
    const txReceipt = await depositTxResponse.wait();
    this.logger.info(`deposit transaction for deposit(id=${deposit.id}) is confirmed on source chain`);
    newStatus = DepositStatus.SRC_CONFIRMED;
    deposit.srcTxHash = txReceipt.transactionHash;
    await this._updateDepositStatus(deposit, newStatus, statusCallback);
    if (deposit.bridge === BridgeType.LOOP) {
      if (deposit.status === DepositStatus.SRC_CONFIRMED) {
        this.logger.info(`deposit transaction for deposit(id=${deposit.id}) succeeded`);
        await this._updateDepositStatus(deposit, DepositStatus.SUCCEEDED, statusCallback);
      }
    }
    await this._createPrivateNoteIfNecessary(deposit, txReceipt);
  }

  async _updateDeposit(deposit) {
    this.db.deposits.update(deposit.data);
    await this.saveDatabase();
    this.logger.info(`deposit(id=${deposit.id}) has been updated`);
    return deposit;
  }

  async _updateDepositStatus(deposit, newStatus, statusCallback) {
    if (deposit.status === newStatus) {
      return await this._updateDeposit(deposit);
    }
    const oldStatus = deposit.status;
    deposit.status = newStatus;
    await this._updateDeposit(deposit);
    if (statusCallback && statusCallback instanceof Function) {
      statusCallback(new Deposit(deposit), oldStatus, newStatus);
    }
    this.logger.info(
      `successfully updated deposit(id=${deposit.id}) status from ${oldStatus} to ${newStatus}`,
    );
    return deposit;
  }

  async _createPrivateNoteIfNecessary(deposit, txReceipt) {
    const account = this.accountHandler.getAccount(deposit.shieldedRecipientAddress);
    if (account) {
      const existingOne = this.noteHandler.getPrivateNotes({
        filterFunc: (note) => {
          return (
            note.srcChainId === deposit.srcChainId &&
            note.commitmentHash.toString() === deposit.commitmentHash.toString()
          );
        },
      });
      if (!existingOne || existingOne.length === 0) {
        return await this.noteHandler._createPrivateNoteFromTxReceipt(
          deposit.srcChainId,
          txReceipt,
          false,
          undefined,
          deposit.shieldedRecipientAddress,
        );
      }
    }
  }
}
