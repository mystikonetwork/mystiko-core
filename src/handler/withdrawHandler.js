import BN from 'bn.js';
import { ethers } from 'ethers';
import { Handler } from './handler.js';
import { WalletHandler } from './walletHandler.js';
import { AccountHandler } from './accountHandler.js';
import { NoteHandler } from './noteHandler.js';
import { ProviderPool } from '../chain/provider.js';
import { ContractPool } from '../chain/contract.js';
import { check, toBuff, toString, toHexNoPrefix } from '../utils.js';
import { checkSigner } from '../chain/signer.js';
import { Withdraw, WithdrawStatus, PrivateNoteStatus, ID_KEY } from '../model';

/**
 * @class WithdrawHandler
 * @extends Handler
 * @desc handler class for Withdraw related business logic
 * @param {WalletHandler} walletHandler instance of {@link WalletHandler}.
 * @param {AccountHandler} accountHandler instance of {@link AccountHandler}.
 * @param {NoteHandler} noteHandler instance of {@link NoteHandler}.
 * @param {ProviderPool} providerPool instance of {@link ProviderPool}.
 * @param {ContractPool} contractPool instance of {@link ContractPool}.
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 */
export class WithdrawHandler extends Handler {
  constructor(walletHandler, accountHandler, noteHandler, providerPool, contractPool, db, conf) {
    super(db, conf);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(accountHandler instanceof AccountHandler, 'accountHandler should be instance of AccountHandler');
    check(noteHandler instanceof NoteHandler, 'noteHandler should be instance of NoteHandler');
    check(providerPool instanceof ProviderPool, 'providerPool should be instance of ProviderPool');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.accountHandler = accountHandler;
    this.noteHandler = noteHandler;
    this.providerPool = providerPool;
    this.contractPool = contractPool;
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
  async createWithdraw(
    walletPassword,
    { privateNote, recipientAddress },
    signer,
    statusCallback = undefined,
  ) {
    this.walletHandler.checkPassword(walletPassword);
    const wallet = this.walletHandler.getCurrentWallet();
    check(ethers.utils.isAddress(recipientAddress), `${recipientAddress} is invalid address`);
    privateNote = this.noteHandler.getPrivateNote(privateNote);
    check(privateNote, 'given privateNote does not exist');
    check(privateNote.status !== PrivateNoteStatus.SPENT, 'private note has been spent');
    await checkSigner(signer, privateNote.dstChainId, this.config);
    const account = this.accountHandler.getAccount(privateNote.shieldedAddress);
    check(account, `account does not exist with ${privateNote.shieldedAddress}`);
    const chainConfig = this.config.getChainConfig(privateNote.dstChainId);
    check(chainConfig, 'chain config does not exist');
    const contractConfig = chainConfig.getContract(privateNote.dstProtocolAddress);
    check(contractConfig, 'contract config does not exist');
    const contract = this.contractPool.getContract(privateNote.dstChainId, privateNote.dstProtocolAddress);
    check(contract, 'contract instance does not exist');
    const withdraw = new Withdraw();
    withdraw.chainId = privateNote.dstChainId;
    withdraw.asset = privateNote.dstAsset;
    withdraw.assetAddress = privateNote.dstAssetAddress;
    withdraw.amount = privateNote.amount;
    withdraw.recipientAddress = recipientAddress;
    withdraw.walletId = wallet.id;
    withdraw.shieldedAddress = privateNote.shieldedAddress;
    withdraw.privateNoteId = privateNote.id;
    withdraw.status = WithdrawStatus.INIT;
    this.db.withdraws.insert(withdraw.data);
    await this.saveDatabase();
    const withdrawPromise = this._generateProof(
      account,
      walletPassword,
      privateNote,
      contract,
      contractConfig,
      withdraw,
      statusCallback,
    )
      .then((zkProof) => {
        return this._sendWithdraw(
          signer,
          privateNote,
          contract,
          withdraw,
          zkProof,
          recipientAddress,
          statusCallback,
        );
      })
      .catch((error) => {
        withdraw.errorMessage = toString(error);
        return this._updateStatus(withdraw, WithdrawStatus.FAILED, statusCallback);
      });
    return { withdraw, withdrawPromise };
  }

  /**
   * @desc get a {@link Withdraw} instance from the given query.
   * @param {number|string|Withdraw} query if the query is a number, it searches the database by using query as id.
   * If the query is string, it searches the database by using query as {@link Withdraw#transactionHash} or
   * {@link Withdraw#serialNumber}. If the query is an instance of
   * {@link Withdraw}, it just returns that instance.
   * @returns {Withdraw|undefined} the found instance of {@link Withdraw}. If the given query does not fit
   * any private note instance, it returns undefined.
   */
  getWithdraw(query) {
    let withdraw;
    if (typeof query === 'number') {
      withdraw = this.db.withdraws.findOne({ [ID_KEY]: query });
    } else if (typeof query === 'string') {
      withdraw = this.db.withdraws.findOne({ transactionHash: query });
      if (!withdraw) {
        withdraw = this.db.withdraws.findOne({ serialNumber: query });
      }
    } else if (query instanceof Withdraw) {
      return query;
    }
    return withdraw ? new Withdraw(withdraw) : undefined;
  }

  /**
   * @desc get an array of {@link Withdraw} with the given filtering/sorting/pagination criteria.
   * @param {object} [options={}] an object contains the search criteria.
   * @param {Function} [options.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Withdraw}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [options.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [options.desc] whether the returned array should be sorted in descending order.
   * @param {number} [options.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [options.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Withdraw[]} an array of {@link Withdraw} which meets the search criteria.
   */
  getWithdraws({ filterFunc, sortBy, desc, offset, limit } = {}) {
    const wallet = this.walletHandler.checkCurrentWallet();
    const whereClause = (rawObject) => {
      if (filterFunc && filterFunc instanceof Function) {
        return rawObject.walletId === wallet.id && filterFunc(new Withdraw(rawObject));
      }
      return rawObject.walletId === wallet.id;
    };
    let queryChain = this.db.withdraws.chain().where(whereClause);
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Withdraw(rawObject));
  }

  async _buildMerkleTree(contract, leaf) {
    let leaves = await contract.queryFilter('MerkleTreeInsert');
    let leafIndex = -1;
    let index = 0;
    leaves = leaves
      .sort((e1, e2) => e1.args.leafIndex - e2.args.leafIndex)
      .map((e) => {
        const leafOther = new BN(toHexNoPrefix(e.args.leaf), 16);
        if (leafOther.toString() === leaf.toString()) {
          leafIndex = index;
        }
        index = index + 1;
        return leafOther;
      });
    check(leafIndex !== -1, 'cannot find leaf on the merkle tree');
    return { leaves, leafIndex };
  }

  async _generateProof(
    account,
    walletPassword,
    privateNote,
    contract,
    contractConfig,
    withdraw,
    statusCallback,
  ) {
    await this._updateStatus(withdraw, WithdrawStatus.GENERATING_PROOF, statusCallback);
    const { leaves, leafIndex } = await this._buildMerkleTree(contract, privateNote.commitmentHash);
    const pkVerify = account.verifyPublicKey;
    const pkEnc = account.encPublicKey;
    const skVerify = this.protocol.secretKeyForVerification(
      toBuff(this.protocol.decryptSymmetric(walletPassword, account.encryptedVerifySecretKey)),
    );
    const skEnc = this.protocol.secretKeyForEncryption(
      toBuff(this.protocol.decryptSymmetric(walletPassword, account.encryptedEncSecretKey)),
    );
    const circuitConfig = this.config.getCircuitConfig(contractConfig.circuits);
    const zkProof = await this.protocol.zkProve(
      pkVerify,
      skVerify,
      pkEnc,
      skEnc,
      privateNote.amount,
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
    return { proofA, proofB, proofC, rootHash, serialNumber, amount };
  }

  async _sendWithdraw(
    signer,
    privateNote,
    contract,
    withdraw,
    { proofA, proofB, proofC, rootHash, serialNumber, amount },
    recipientAddress,
    statusCallback,
  ) {
    contract = contract.connect(signer.signer);
    const txResponse = await contract.withdraw(
      proofA,
      proofB,
      proofC,
      rootHash,
      serialNumber,
      amount,
      recipientAddress,
    );
    withdraw.merkleRootHash = new BN(rootHash);
    withdraw.serialNumber = new BN(serialNumber);
    withdraw.transactionHash = txResponse.hash;
    await this._updateStatus(withdraw, WithdrawStatus.PENDING, statusCallback);
    const txReceipt = await txResponse.wait();
    withdraw.transactionHash = txReceipt.transactionHash;
    await this._updateStatus(withdraw, WithdrawStatus.SUCCEEDED, statusCallback);
    privateNote.withdrawTransactionHash = txReceipt.transactionHash;
    await this.noteHandler.updateStatus(privateNote, PrivateNoteStatus.SPENT);
  }

  async _update(deposit) {
    this.db.withdraws.update(deposit.data);
    return await this.saveDatabase();
  }

  async _updateStatus(withdraw, newStatus, statusCallback) {
    if (withdraw.status === newStatus) {
      return await this._update(withdraw);
    }
    const oldStatus = withdraw.status;
    withdraw.status = newStatus;
    await this._update(withdraw);
    if (statusCallback && statusCallback instanceof Function) {
      statusCallback(withdraw, oldStatus, newStatus);
    }
    return withdraw;
  }
}
