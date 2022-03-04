import BN from 'bn.js';
import { ethers } from 'ethers';
import { MystikoConfig } from '@mystiko/config';
import { check, errorMessage, logger as rootLogger, toBN, toBuff, toHexNoPrefix } from '@mystiko/utils';
import { Handler } from './handler';
import { WalletHandler } from './walletHandler';
import { AccountHandler } from './accountHandler';
import { ContractHandler } from './contractHandler';
import { NoteHandler } from './noteHandler';
import { BaseSigner, checkSigner, ContractPool, MystikoContract, ProviderPool } from '../chain';
import {
  Account,
  BaseModel,
  Contract,
  ID_KEY,
  PrivateNote,
  PrivateNoteStatus,
  Withdraw,
  WithdrawStatus,
} from '../model';
import { MystikoDatabase } from '../database';

interface QueryParams {
  filterFunc?: (withdraw: Withdraw) => boolean;
  sortBy?: string;
  desc?: boolean;
  offset?: number;
  limit?: number;
}

interface ZKProof {
  proofA: string[];
  proofB: string[][];
  proofC: string[];
  rootHash: string;
  serialNumber: string;
  amount: string;
}

export interface WithdrawParams {
  privateNote: number | string | PrivateNote;
  recipientAddress: string;
}

/**
 * @class WithdrawHandler
 * @extends Handler
 * @desc handler class for Withdraw related business logic
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {ContractHandler} contractHandler instance of {@link ContractHandler}.
 * @param {NoteHandler} noteHandler instance of {@link NoteHandler}.
 * @param {ProviderPool} providerPool instance of {@link ProviderPool}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class WithdrawHandler extends Handler {
  private readonly walletHandler: WalletHandler;

  private readonly accountHandler: AccountHandler;

  private readonly contractHandler: ContractHandler;

  private readonly noteHandler: NoteHandler;

  private readonly providerPool: ProviderPool;

  private readonly contractPool: ContractPool;

  constructor(
    walletHandler: WalletHandler,
    accountHandler: AccountHandler,
    contractHandler: ContractHandler,
    noteHandler: NoteHandler,
    providerPool: ProviderPool,
    contractPool: ContractPool,
    db: MystikoDatabase,
    conf?: MystikoConfig,
  ) {
    super(db, conf);
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.contractHandler = contractHandler;
    this.noteHandler = noteHandler;
    this.providerPool = providerPool;
    this.contractPool = contractPool;
    this.logger = rootLogger.getLogger('WithdrawHandler');
  }

  /**
   * @desc create a withdrawal transaction with the given private note information.
   * @param {string} walletPassword the password of the current running {@link Wallet}.
   * @param {Object} request the request object.
   * @param {number|string|PrivateNote} request.privateNote id or transaction hash or an instance of
   * {@link PrivateNote} for this withdrawal transaction.
   * @param {string} request.recipientAddress The recipient address to receive the asset once this withdrawal
   * transaction is confirmed successfully.
   * @param {BaseSigner} signer the {@link BaseSigner} instance which is used to sign the withdrawal transaction.
   * @param {Function} [statusCallback] a callback function that will be called when the status of
   * the withdrawal transaction changes. It should be constructed like this:
   * (withdraw: {@link Withdraw}, oldStatus: {@link module:mystiko/models.WithdrawStatus}, newStatus: {@link module:mystiko/models.WithdrawStatus}) => {}
   * @returns {Promise<{withdrawPromise: Promise<void>, withdraw: Withdraw}>} a promise of an object which contains two
   * fields: withdraw and withdrawPromise. the withdrawPromise will be resolved after the withdrawal transaction is
   * confirmed on the destination chain. The Withdraw instance is immediately returned once the transaction is initialized.
   * If any error occurs during the transaction, the {@link Withdraw#errorMessage} will be set to be non-undefined.
   * Please check the {@link Withdraw#errorMessage} if you find {@link Withdraw#status} is FAILED.
   */
  public async createWithdraw(
    walletPassword: string,
    request: WithdrawParams,
    signer: BaseSigner,
    statusCallback?: (withdraw: Withdraw, oldStatus: WithdrawStatus, newStatus: WithdrawStatus) => void,
  ): Promise<{ withdraw: Withdraw; withdrawPromise: Promise<Withdraw> }> {
    check(this.walletHandler.checkPassword(walletPassword), 'incorrect walletPassword is given');
    const wallet = this.walletHandler.checkCurrentWallet();
    const { privateNote, recipientAddress } = request;
    check(ethers.utils.isAddress(recipientAddress), `${recipientAddress} is invalid address`);
    const wrappedPrivateNote = this.noteHandler.getPrivateNote(privateNote);
    if (!wrappedPrivateNote) {
      return Promise.reject(new Error(`private note ${privateNote.toString()} does not exist`));
    }
    check(wrappedPrivateNote.status !== PrivateNoteStatus.SPENT, 'private note has been spent');
    if (
      !wrappedPrivateNote.dstChainId ||
      !wrappedPrivateNote.shieldedAddress ||
      !wrappedPrivateNote.dstProtocolAddress
    ) {
      return Promise.reject(
        new Error(
          `PrivateNote(id=${wrappedPrivateNote.id}) does not have all required fields for withdrawing`,
        ),
      );
    }
    await checkSigner(signer, wrappedPrivateNote.dstChainId, this.config);
    const account = this.accountHandler.getAccount(wrappedPrivateNote.shieldedAddress);
    if (!account) {
      return Promise.reject(new Error(`account does not exist with ${wrappedPrivateNote.shieldedAddress}`));
    }
    const contractConfig = this.contractHandler.getContract(
      wrappedPrivateNote.dstChainId,
      wrappedPrivateNote.dstProtocolAddress,
    );
    if (!contractConfig) {
      return Promise.reject(
        new Error(
          `Contract(address=${wrappedPrivateNote.dstProtocolAddress}) does not exist in local database`,
        ),
      );
    }
    const wrappedContract = this.contractPool.getWrappedContract(
      wrappedPrivateNote.dstChainId,
      wrappedPrivateNote.dstProtocolAddress,
    );
    if (!wrappedContract || !wrappedContract.rawContract) {
      return Promise.reject(
        new Error(
          `MystikoContract(address=${wrappedPrivateNote.dstProtocolAddress}) does not exist in local database`,
        ),
      );
    }
    const contract = wrappedContract.rawContract;
    const withdraw = new Withdraw();
    withdraw.chainId = wrappedPrivateNote.dstChainId;
    withdraw.asset = wrappedPrivateNote.dstAsset;
    withdraw.assetAddress = wrappedPrivateNote.dstAssetAddress;
    withdraw.assetDecimals = wrappedPrivateNote.dstAssetDecimals;
    withdraw.amount = wrappedPrivateNote.amount;
    withdraw.recipientAddress = recipientAddress;
    withdraw.walletId = wallet.id;
    withdraw.shieldedAddress = wrappedPrivateNote.shieldedAddress;
    withdraw.privateNoteId = wrappedPrivateNote.id;
    withdraw.status = WithdrawStatus.INIT;
    this.db.withdraws.insert(withdraw.data);
    await this.saveDatabase();
    const withdrawPromise = this.generateProof(
      account,
      walletPassword,
      wrappedPrivateNote,
      wrappedContract,
      contract,
      contractConfig,
      withdraw,
      statusCallback,
    )
      .then((zkProof) =>
        this.sendWithdraw(
          signer,
          wrappedPrivateNote,
          contract,
          withdraw,
          zkProof,
          recipientAddress,
          statusCallback,
        ),
      )
      .then(() => (withdraw.id ? this.getWithdraw(withdraw.id) || withdraw : withdraw))
      .catch((error) => {
        withdraw.errorMessage = errorMessage(error);
        this.logger.error(`withdraw(id=${withdraw.id}) transaction raised error: ${withdraw.errorMessage}`);
        return this.updateStatus(withdraw, WithdrawStatus.FAILED, statusCallback);
      });
    this.logger.info(`successfully created a withdraw(id=${withdraw.id}), waiting on the transaction...`);
    return { withdraw: new Withdraw(withdraw), withdrawPromise };
  }

  /**
   * @desc get a {@link Withdraw} instance from the given query.
   * @param {number | string | Withdraw} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link Withdraw#transactionHash} or
   * {@link Withdraw#serialNumber}. If the query is an instance of
   * {@link Withdraw}, it just returns that instance.
   * @returns {Withdraw|undefined} the found instance of {@link Withdraw}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  public getWithdraw(query: number | string | Withdraw): Withdraw | undefined {
    let withdraw;
    if (typeof query === 'number') {
      withdraw = this.db.withdraws.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string') {
      withdraw = this.db.withdraws.findOne({ transactionHash: query });
      if (!withdraw) {
        withdraw = this.db.withdraws.findOne({ serialNumber: query });
      }
    } else if (query.id) {
      return this.getWithdraw(query.id);
    }
    return withdraw ? new Withdraw(withdraw) : undefined;
  }

  /**
   * @desc get an array of {@link Withdraw} with the given filtering/sorting/pagination criteria.
   * @param {QueryParams} [queryParams={}] an object contains the search criteria.
   * @param {Function} [queryParams.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Withdraw}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [queryParams.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [queryParams.desc] whether the returned array should be sorted in descending order.
   * @param {number} [queryParams.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [queryParams.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Withdraw[]} an array of {@link Withdraw} which meets the search criteria.
   */
  public getWithdraws(queryParams: QueryParams = {}): Withdraw[] {
    const { filterFunc, sortBy, desc, offset, limit } = queryParams;
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject: Object) => {
      const withdraw = new Withdraw(rawObject);
      if (filterFunc) {
        return withdraw.walletId === wallet.id && filterFunc(withdraw);
      }
      return withdraw.walletId === wallet.id;
    };
    let queryChain = this.db.withdraws.chain().where(whereClause);
    if (sortBy) {
      queryChain = queryChain.sort((w1, w2) =>
        BaseModel.columnComparator(new Withdraw(w1), new Withdraw(w2), sortBy, desc || false),
      );
    }
    if (offset) {
      queryChain = queryChain.offset(offset);
    }
    if (limit) {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Withdraw(rawObject));
  }

  public async updateWithdraw(withdraw: Withdraw): Promise<Withdraw> {
    this.db.withdraws.update(withdraw.data);
    await this.saveDatabase();
    this.logger.info(`withdraw(id=${withdraw.id}) has been updated`);
    return withdraw;
  }

  public async updateStatus(
    withdraw: Withdraw,
    newStatus: WithdrawStatus,
    statusCallback?: (withdraw: Withdraw, oldStatus: WithdrawStatus, newStatus: WithdrawStatus) => void,
  ): Promise<Withdraw> {
    if (withdraw.status === newStatus) {
      return this.updateWithdraw(withdraw);
    }
    const oldStatus = withdraw.status;
    const newWithdraw = new Withdraw(withdraw);
    newWithdraw.status = newStatus;
    await this.updateWithdraw(newWithdraw);
    if (statusCallback) {
      statusCallback(newWithdraw, oldStatus || WithdrawStatus.INIT, newStatus);
    }
    this.logger.info(
      `successfully updated withdraw(id=${newWithdraw.id}) status from ${oldStatus} to ${newStatus}`,
    );
    return newWithdraw;
  }

  private static async buildMerkleTree(
    contract: ethers.Contract,
    leaf: BN,
  ): Promise<{ leaves: BN[]; leafIndex: number }> {
    const leaves = await contract.queryFilter(contract.filters.MerkleTreeInsert());
    let leafIndex = -1;
    let index = 0;
    const convertedLeaves = leaves
      .sort((e1, e2) => (e1.args?.leafIndex || 0) - (e2.args?.leafIndex || 0))
      .map((e) => {
        const leafOther = toBN(toHexNoPrefix(e.args?.leaf || '0'), 16);
        if (leafOther.toString() === leaf.toString()) {
          leafIndex = index;
        }
        index += 1;
        return leafOther;
      });
    check(
      leafIndex !== -1,
      'cannot find your deposit on chains, maybe it has not been relayed to destination chain?',
    );
    return { leaves: convertedLeaves, leafIndex };
  }

  private async generateProof(
    account: Account,
    walletPassword: string,
    privateNote: PrivateNote,
    wrappedContract: MystikoContract,
    contract: ethers.Contract,
    contractConfig: Contract,
    withdraw: Withdraw,
    statusCallback?: (withdraw: Withdraw, oldStatus: WithdrawStatus, newStatus: WithdrawStatus) => void,
  ): Promise<ZKProof> {
    if (!privateNote.amount || !privateNote.commitmentHash || !privateNote.encryptedOnChainNote) {
      return Promise.reject(
        new Error(`PrivateNote(id=${privateNote.id}) does not contain some required fields for withdrawing`),
      );
    }
    if (
      !account.verifyPublicKey ||
      !account.encPublicKey ||
      !account.encryptedVerifySecretKey ||
      !account.encryptedEncSecretKey
    ) {
      return Promise.reject(
        new Error(`Account(id=${account.id}) does not contain some required fields for withdrawing`),
      );
    }
    if (!withdraw.recipientAddress) {
      return Promise.reject(new Error(`Withdraw(id=${withdraw.id}) does not contain some required fields`));
    }
    if (!contractConfig.circuits) {
      return Promise.reject(
        new Error(`Contract(address=${contractConfig.address}) does not have circuits schema defined`),
      );
    }
    await this.updateStatus(withdraw, WithdrawStatus.GENERATING_PROOF, statusCallback);
    const balance = await wrappedContract.assetBalance();
    check(balance.gte(privateNote.amount), 'insufficient pool balance for withdrawing');
    this.logger.info(`generating zkSnark proofs for withdraw(id=${withdraw.id})...`);
    const { leaves, leafIndex } = await WithdrawHandler.buildMerkleTree(contract, privateNote.commitmentHash);
    const pkVerify = account.verifyPublicKey;
    const pkEnc = account.encPublicKey;
    const skVerify = this.protocol.secretKeyForVerification(
      toBuff(this.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey)),
    );
    const skEnc = this.protocol.secretKeyForEncryption(
      toBuff(this.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey)),
    );
    const circuitConfig = this.config.getCircuitConfig(contractConfig.circuits);
    if (!circuitConfig || !circuitConfig.wasmFile || !circuitConfig.zkeyFile || !circuitConfig.vkeyFile) {
      return Promise.reject(new Error('circuit config does not contain all required fields'));
    }
    const zkProof = await this.protocol.zkProveWithdraw(
      pkVerify,
      skVerify,
      pkEnc,
      skEnc,
      privateNote.amount,
      withdraw.recipientAddress,
      privateNote.commitmentHash,
      privateNote.encryptedOnChainNote,
      leaves,
      leafIndex,
      circuitConfig.wasmFile,
      circuitConfig.zkeyFile,
    );
    const validProof = await this.protocol.zkVerify(
      zkProof.proof,
      zkProof.publicSignals,
      circuitConfig.vkeyFile,
    );
    check(validProof, 'generated an invalid proof');
    this.logger.info(`successfully generated zkSnark proofs for withdraw(id=${withdraw.id})`);
    const { proof, publicSignals } = zkProof;
    const proofA = [proof.pi_a[0], proof.pi_a[1]];
    const proofB = [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ];
    const proofC = [proof.pi_c[0], proof.pi_c[1]];
    const rootHash = publicSignals[0];
    const serialNumber = publicSignals[1];
    const amount = publicSignals[2];
    await this.updateStatus(withdraw, WithdrawStatus.PROOF_GENERATED, statusCallback);
    return { proofA, proofB, proofC, rootHash, serialNumber, amount };
  }

  private async sendWithdraw(
    signer: BaseSigner,
    privateNote: PrivateNote,
    contract: ethers.Contract,
    withdraw: Withdraw,
    zkProof: ZKProof,
    recipientAddress: string,
    statusCallback?: (withdraw: Withdraw, oldStatus: WithdrawStatus, newStatus: WithdrawStatus) => void,
  ) {
    const { proofA, proofB, proofC, rootHash, serialNumber, amount } = zkProof;
    const connectedContract = contract.connect(signer.signer);
    this.logger.info(`start submitting withdrawal transaction for withdraw(id=${withdraw.id})`);
    const txResponse = await connectedContract.withdraw(
      proofA,
      proofB,
      proofC,
      rootHash,
      serialNumber,
      amount,
      recipientAddress,
    );
    this.logger.info(
      `withdrawal transaction for withdraw(id=${withdraw.id}) is submitted ` +
        `with txHash='${txResponse.hash}', waiting for confirmation...`,
    );
    const newWithdraw = new Withdraw(withdraw);
    newWithdraw.merkleRootHash = toBN(rootHash);
    newWithdraw.serialNumber = toBN(serialNumber);
    newWithdraw.transactionHash = txResponse.hash;
    await this.updateStatus(newWithdraw, WithdrawStatus.PENDING, statusCallback);
    const txReceipt = await txResponse.wait();
    this.logger.info(`withdrawal transaction for withdraw(id=${newWithdraw.id}) is confirmed on chain`);
    newWithdraw.transactionHash = txReceipt.transactionHash;
    await this.updateStatus(newWithdraw, WithdrawStatus.SUCCEEDED, statusCallback);
    const newPrivateNote = new PrivateNote(privateNote);
    newPrivateNote.withdrawTransactionHash = txReceipt.transactionHash;
    newPrivateNote.status = PrivateNoteStatus.SPENT;
    await this.noteHandler.updatePrivateNote(newPrivateNote);
  }
}