import BN from 'bn.js';
import { ethers } from 'ethers';
import { AssetType, BridgeType, ContractConfig, MystikoConfig } from '@mystiko/config';
import {
  check,
  errorMessage,
  logger as rootLogger,
  toBN,
  toDecimals,
  toFixedLenHex,
  toHex,
  toString,
} from '@mystiko/utils';
import { Handler } from './handler';
import { WalletHandler } from './walletHandler';
import { AccountHandler } from './accountHandler';
import { NoteHandler } from './noteHandler';
import { BaseSigner, checkSigner, ContractPool } from '../chain';
import { BaseModel, Deposit, DepositReceipt, DepositStatus, ID_KEY, PrivateNote } from '../model';
import { MystikoDatabase } from '../database';

export interface DepositParams {
  srcChainId: number;
  dstChainId: number;
  assetSymbol: string;
  bridge: BridgeType;
  amount: number;
  shieldedAddress: string;
}

interface QueryParam {
  filterFunc?: (deposit: Deposit) => boolean;
  sortBy?: string;
  desc?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * @class DepositHandler
 * @extends Handler
 * @desc handler class for Deposit related business logic.
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {NoteHandler} noteHandler instance of {@link NoteHandler}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class DepositHandler extends Handler {
  private readonly walletHandler: WalletHandler;

  private readonly accountHandler: AccountHandler;

  private readonly noteHandler: NoteHandler;

  private readonly contractPool: ContractPool;

  constructor(
    walletHandler: WalletHandler,
    accountHandler: AccountHandler,
    noteHandler: NoteHandler,
    contractPool: ContractPool,
    db: MystikoDatabase,
    config?: MystikoConfig,
  ) {
    super(db, config);
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.noteHandler = noteHandler;
    this.contractPool = contractPool;
    this.logger = rootLogger.getLogger('DepositHandler');
  }

  /**
   * @desc create a deposit transaction based on the user's request.
   * @param {DepositParams} request the request object.
   * @param {number} request.srcChainId the source chain id which this deposit will be sent from.
   * @param {number} request.dstChainId the destination chain id which this deposit will be sent to.
   * @param {string} request.assetSymbol the symbol of asset this deposit will operate.
   * @param {BridgeType} request.bridge the cross-chain bridge type which this deposit will
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
    request: DepositParams,
    signer: BaseSigner,
    statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void,
  ): Promise<{ deposit: Deposit; depositPromise: Promise<Deposit> }> {
    const { srcChainId, dstChainId, assetSymbol, bridge, amount, shieldedAddress } = request;
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
    const convertedAmount = toDecimals(amount, contractConfig.assetDecimals);
    const { commitmentHash, randomS, k, privateNote } = await this.protocol.commitmentWithShieldedAddress(
      shieldedAddress,
      convertedAmount,
    );
    const deposit = new Deposit();
    deposit.srcChainId = srcChainId;
    deposit.dstChainId = dstChainId;
    deposit.bridge = bridge;
    deposit.asset = assetSymbol;
    deposit.assetType = contractConfig.assetType;
    deposit.assetDecimals = contractConfig.assetDecimals;
    deposit.amount = convertedAmount;
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
    const depositPromise = DepositHandler.checkBalance(
      deposit,
      signer,
      contractConfig,
      depositContracts.asset,
    )
      .then(() =>
        this.approveAsset(signer, deposit, depositContracts, statusCallback).then((newDeposit) =>
          this.sendDeposit(
            signer,
            newDeposit,
            contractConfig,
            depositContracts,
            contractConfig.assetType === AssetType.MAIN,
            statusCallback,
          ).then((txReceipt) => this.createPrivateNoteIfNecessary(deposit, txReceipt)),
        ),
      )
      .then(() => (deposit.id ? this.getDeposit(deposit.id) || deposit : deposit))
      .catch((error) => {
        deposit.errorMessage = errorMessage(error);
        this.logger.error(`deposit(id=${deposit.id}) transaction raised error: ${deposit.errorMessage}`);
        return this.updateDepositStatus(deposit, DepositStatus.FAILED, statusCallback);
      });
    this.logger.info(`successfully created a deposit(id=${deposit.id}), waiting on the transaction(s)...`);
    return { deposit: new Deposit(deposit), depositPromise };
  }

  /**
   * @desc get a {@link Deposit} instance from the given query.
   * @param {number | string | Deposit} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link Deposit#srcTxHash} or
   * {@link Deposit#dstTxHash} or {@link Deposit#bridgeTxHash}. If the query is an instance of
   * {@link Deposit}, it just returns that instance.
   * @returns {Deposit|undefined} the found instance of {@link Deposit}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  public getDeposit(query: number | string | Deposit): Deposit | undefined {
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
    } else if (query.id) {
      return this.getDeposit(query.id);
    }
    return deposit ? new Deposit(deposit) : undefined;
  }

  /**
   * @desc get an array of {@link Deposit} with the given filtering/sorting/pagination criteria.
   * @param {QueryParam} [queryParams={}] an object contains the search criteria.
   * @param {Function} [queryParams.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Deposit}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [queryParams.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [queryParams.desc] whether the returned array should be sorted in descending order.
   * @param {number} [queryParams.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [queryParams.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Deposit[]} an array of {@link Deposit} which meets the search criteria.
   */
  public getDeposits(queryParams: QueryParam = {}): Deposit[] {
    const { filterFunc, sortBy, desc, offset, limit } = queryParams;
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject: Object) => {
      const deposit = new Deposit(rawObject);
      if (filterFunc) {
        return deposit.walletId === wallet.id && filterFunc(deposit);
      }
      return deposit.walletId === wallet.id;
    };
    let queryChain = this.db.deposits.chain().where(whereClause);
    if (sortBy) {
      queryChain = queryChain.sort((d1, d2) =>
        BaseModel.columnComparator(new Deposit(d1), new Deposit(d2), sortBy, desc || false),
      );
    }
    if (offset) {
      queryChain = queryChain.offset(offset);
    }
    if (limit) {
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
  public getDepositsCount(filterFunc?: (deposit: Deposit) => boolean): number {
    return this.getDeposits({ filterFunc }).length;
  }

  /**
   * @desc export an off-chain note based the deposit information.
   * @param {number | string | Deposit} depositQuery if the query is a number, it searches the database by using query
   * as id. If the query is string, it searches the database by using query as {@link Deposit#srcTxHash} or
   * {@link Deposit#dstTxHash} or {@link Deposit#bridgeTxHash}. If the query is an instance of
   * {@link Deposit}, it just returns that instance.
   * @returns {DepositReceipt} the instance of {@link DepositReceipt}
   */
  public exportOffChainNote(depositQuery: number | string | Deposit): DepositReceipt {
    const deposit = this.getDeposit(depositQuery);
    if (!deposit) {
      throw new Error(`deposit ${depositQuery} does not exist`);
    }
    if (!deposit.srcTxHash || !deposit.srcChainId) {
      throw new Error(`deposit(id=${deposit.id}) has not been ready for exporting deposit receipt`);
    }
    return new DepositReceipt({ chainId: deposit.srcChainId, transactionHash: deposit.srcTxHash });
  }

  public async updateDeposit(deposit: Deposit): Promise<Deposit> {
    this.db.deposits.update(deposit.data);
    await this.saveDatabase();
    this.logger.info(`deposit(id=${deposit.id}) has been updated`);
    return deposit;
  }

  public async updateDepositStatus(
    deposit: Deposit,
    newStatus: DepositStatus,
    statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void,
  ): Promise<Deposit> {
    if (deposit.status === newStatus) {
      return this.updateDeposit(deposit);
    }
    const oldStatus = deposit.status;
    const newDeposit = new Deposit(deposit);
    newDeposit.status = newStatus;
    await this.updateDeposit(newDeposit);
    if (statusCallback) {
      statusCallback(newDeposit, oldStatus || DepositStatus.INIT, newStatus);
    }
    this.logger.info(
      `successfully updated deposit(id=${newDeposit.id}) status from ${oldStatus} to ${newStatus}`,
    );
    return newDeposit;
  }

  public createPrivateNoteIfNecessary(
    deposit: Deposit,
    txReceipt: ethers.providers.TransactionReceipt,
  ): Promise<PrivateNote | undefined> {
    if (deposit.shieldedRecipientAddress && deposit.commitmentHash && deposit.srcChainId) {
      const account = this.accountHandler.getAccount(deposit.shieldedRecipientAddress);
      if (account) {
        const existingOne = this.noteHandler.getPrivateNotes({
          filterFunc: (note) =>
            note.srcChainId === deposit.srcChainId &&
            note.commitmentHash?.toString() === deposit.commitmentHash?.toString(),
        });
        if (!existingOne || existingOne.length === 0) {
          return this.noteHandler.createPrivateNoteFromTxReceipt(
            deposit.srcChainId,
            txReceipt,
            false,
            undefined,
            deposit.shieldedRecipientAddress,
          );
        }
      }
    }
    return Promise.resolve(undefined);
  }

  private async approveAsset(
    signer: BaseSigner,
    deposit: Deposit,
    contracts: { asset: ethers.Contract | undefined; protocol: ethers.Contract },
    statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void,
  ): Promise<Deposit> {
    const { asset, protocol } = contracts;
    if (deposit.amount) {
      if (asset) {
        const assetContract = asset.connect(signer.signer);
        const spenderAddress = protocol.address;
        const allowance = await asset.allowance(deposit.srcAddress, spenderAddress);
        const allowanceBN = toBN(allowance.toString());
        if (allowanceBN.lt(deposit.amount)) {
          this.logger.info(`start submitting asset approving transaction for deposit(id=${deposit.id})`);
          const txResponse = await assetContract.approve(protocol.address, deposit.amount.toString());
          this.logger.info(
            `asset approving transaction for deposit(id=${deposit.id}) is submitted ` +
              `with txHash='${txResponse.hash}', waiting for confirmation...`,
          );
          let newDeposit = new Deposit(deposit);
          newDeposit.assetApproveTxHash = txResponse.hash;
          newDeposit = await this.updateDepositStatus(
            newDeposit,
            DepositStatus.ASSET_APPROVING,
            statusCallback,
          );
          let newStatus = newDeposit.status;
          const txReceipt = await txResponse.wait();
          this.logger.info(
            `asset approving transaction for deposit(id=${newDeposit.id}) is confirmed on chain`,
          );
          newStatus = DepositStatus.ASSET_APPROVED;
          newDeposit.assetApproveTxHash = txReceipt.transactionHash;
          return this.updateDepositStatus(newDeposit, newStatus, statusCallback);
        }
      }
    }
    return this.updateDepositStatus(deposit, DepositStatus.ASSET_APPROVED, statusCallback);
  }

  private async sendDeposit(
    signer: BaseSigner,
    deposit: Deposit,
    contractConfig: ContractConfig,
    depositContracts: { asset: ethers.Contract | undefined; protocol: ethers.Contract },
    isMainAsset: boolean,
    statusCallback?: (deposit: Deposit, oldStatus: DepositStatus, newStatus: DepositStatus) => void,
  ): Promise<ethers.providers.TransactionReceipt> {
    check(deposit.status === DepositStatus.ASSET_APPROVED, 'token not approved');
    if (
      !deposit.amount ||
      !deposit.commitmentHash ||
      !deposit.hashK ||
      !deposit.randomS ||
      !deposit.privateNote
    ) {
      return Promise.reject(new Error(`deposit(id=${deposit.id}) does not contain all required fields`));
    }
    const protocolContract = await depositContracts.protocol.connect(signer.signer);
    this.logger.info(`start submitting deposit transaction for deposit(id=${deposit.id})`);
    const depositTxResponse = await protocolContract.deposit(
      deposit.amount.toString(),
      toFixedLenHex(deposit.commitmentHash),
      toFixedLenHex(deposit.hashK),
      toFixedLenHex(deposit.randomS, this.protocol.RANDOM_SK_SIZE),
      toHex(deposit.privateNote),
      {
        value: isMainAsset
          ? deposit.amount.add(contractConfig.minBridgeFee).toString()
          : contractConfig.minBridgeFee.toString(),
      },
    );
    this.logger.info(
      `deposit transaction for deposit(id=${deposit.id}) is submitted ` +
        `with txHash='${depositTxResponse.hash}', waiting for confirmation...`,
    );
    let newDeposit = new Deposit(deposit);
    newDeposit.srcTxHash = depositTxResponse.hash;
    newDeposit = await this.updateDepositStatus(newDeposit, DepositStatus.SRC_PENDING, statusCallback);
    let newStatus = newDeposit.status;
    const txReceipt = await depositTxResponse.wait();
    this.logger.info(`deposit transaction for deposit(id=${newDeposit.id}) is confirmed on source chain`);
    newStatus = DepositStatus.SRC_CONFIRMED;
    newDeposit.srcTxHash = txReceipt.transactionHash;
    newDeposit = await this.updateDepositStatus(newDeposit, newStatus, statusCallback);
    if (newDeposit.bridge === BridgeType.LOOP) {
      if (newDeposit.status === DepositStatus.SRC_CONFIRMED) {
        this.logger.info(`deposit transaction for deposit(id=${newDeposit.id}) succeeded`);
        await this.updateDepositStatus(newDeposit, DepositStatus.SUCCEEDED, statusCallback);
      }
    }
    return txReceipt;
  }

  private static async checkBalance(
    deposit: Deposit,
    signer: BaseSigner,
    contractConfig: ContractConfig,
    asset: ethers.Contract | undefined,
  ) {
    if (contractConfig.assetType === AssetType.MAIN || contractConfig.minBridgeFee.gtn(0)) {
      const balance = await signer.signer.getBalance();
      const expectedBalance =
        contractConfig.assetType === AssetType.MAIN && deposit.amount
          ? deposit.amount.add(contractConfig.minBridgeFee)
          : contractConfig.minBridgeFee;
      check(expectedBalance.lte(toBN(toString(balance))), 'insufficient balance');
    }
    if (contractConfig.assetType !== AssetType.MAIN && asset) {
      const balance = await asset.balanceOf(deposit.srcAddress);
      check(toBN(toString(balance)).gte(deposit.amount || new BN(0)), 'insufficient balance');
    }
  }
}
