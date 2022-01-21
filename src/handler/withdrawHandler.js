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
import { Withdraw, WithdrawStatus } from '../model/withdraw.js';
import { PrivateNoteStatus } from '../model/note.js';
import { ID_KEY } from '../model/common';

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

  async createWithdraw(walletPassword, { privateNote, recipientAddress }, signer, statusCallback) {
    this.walletHandler.checkPassword(walletPassword);
    const wallet = this.walletHandler.getCurrentWallet();
    check(ethers.utils.isAddress(recipientAddress), `${recipientAddress} is invalid address`);
    privateNote = this.noteHandler.getPrivateNote(privateNote);
    check(privateNote, 'given privateNote does not exist');
    check(privateNote !== PrivateNoteStatus.SPENT, 'private note has been spent');
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
    withdraw.token = privateNote.dstToken;
    withdraw.tokenAddress = privateNote.dstTokenAddress;
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
    await this.noteHandler._updateStatus(privateNote, PrivateNoteStatus.SPENT);
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
