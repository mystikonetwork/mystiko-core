import BN from 'bn.js';

import { Handler } from './handler.js';
import { check, toHex, toDecimals, toFixedLenHex, toString } from '../utils.js';
import { ContractPool } from '../chain/contract.js';
import { WalletHandler } from './walletHandler.js';
import { checkSigner } from '../chain/signer.js';
import { Deposit, DepositStatus } from '../model/deposit.js';
import { BridgeType } from '../config/contractConfig';
import { ID_KEY } from '../model/common.js';
import { OffchainNote } from '../model/note.js';

export class DepositHandler extends Handler {
  constructor(walletHandler, contractPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.contractPool = contractPool;
  }

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
    await checkSigner(signer, srcChainId);
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
        return this._sendDeposit(signer, deposit, depositContracts, statusCallback);
      })
      .catch((error) => {
        deposit.errorMessage = toString(error);
        return this._updateDepositStatus(deposit, DepositStatus.FAILED, statusCallback);
      });
    return { deposit, depositPromise };
  }

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
      return query;
    }
    return deposit ? new Deposit(deposit) : undefined;
  }

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
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Deposit(rawObject));
  }

  getDepositsCount(filterFunc) {
    return this.getDeposits({ filterFunc }).length;
  }

  exportOffChainNote(depositQuery) {
    const deposit = this.getDeposit(depositQuery);
    check(deposit, `deposit ${depositQuery} does not exist`);
    check(deposit.srcTxHash, 'deposit has not been ready for exporting off-chain note');
    return new OffchainNote({ chainId: deposit.srcChainId, transactionHash: deposit.srcTxHash });
  }

  async _approveAsset(signer, deposit, { asset, protocol }, statusCallback) {
    if (asset) {
      const assetContract = asset.connect(signer.signer);
      const spenderAddress = protocol.address;
      const allowance = await asset.allowance(deposit.srcAddress, spenderAddress);
      const allowanceBN = new BN(allowance.toString());
      if (allowanceBN.lt(deposit.amount)) {
        const txResponse = await assetContract.approve(protocol.address, deposit.amount.toString());
        deposit.assetApproveTxHash = txResponse.hash;
        await this._updateDepositStatus(deposit, DepositStatus.ASSET_APPROVING, statusCallback);
        let newStatus = deposit.status;
        const txReceipt = await txResponse.wait();
        newStatus = DepositStatus.ASSET_APPROVED;
        deposit.assetApproveTxHash = txReceipt.transactionHash;
        await this._updateDepositStatus(deposit, newStatus, statusCallback);
      }
    } else {
      await this._updateDepositStatus(deposit, DepositStatus.ASSET_APPROVED, undefined, statusCallback);
    }
  }

  async _sendDeposit(signer, deposit, depositContracts, statusCallback) {
    if (deposit.status === DepositStatus.ASSET_APPROVED) {
      const protocolContract = await depositContracts.protocol.connect(signer.signer);
      const depositTxResponse = await protocolContract.deposit(
        deposit.amount.toString(),
        toFixedLenHex(deposit.commitmentHash),
        toFixedLenHex(deposit.hashK),
        toFixedLenHex(deposit.randomS),
        toHex(deposit.privateNote),
      );
      deposit.srcTxHash = depositTxResponse.hash;
      await this._updateDepositStatus(deposit, DepositStatus.SRC_PENDING, statusCallback);
      let newStatus = deposit.status;
      const txReceipt = await depositTxResponse.wait();
      newStatus = DepositStatus.SRC_CONFIRMED;
      deposit.srcTxHash = txReceipt.transactionHash;
      await this._updateDepositStatus(deposit, newStatus, statusCallback);
      if (deposit.bridge === BridgeType.LOOP) {
        if (deposit.status === DepositStatus.SRC_CONFIRMED) {
          await this._updateDepositStatus(deposit, DepositStatus.SUCCEEDED, statusCallback);
        }
      }
    }
  }

  async _updateDeposit(deposit) {
    this.db.deposits.update(deposit.data);
    await this.saveDatabase();
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
      statusCallback(deposit, oldStatus, newStatus);
    }
    return deposit;
  }
}
