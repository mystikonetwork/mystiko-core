import BN from 'bn.js';

import { Handler } from './handler.js';
import { check, toHex, toDecimals, toFixedLenHex, toString } from '../utils.js';
import { ContractPool } from '../chain/contract.js';
import { WalletHandler } from './walletHandler.js';
import { checkSigner } from '../chain/signer.js';
import { Deposit, DepositStatus } from '../model/deposit.js';
import { BridgeType } from '../config/contractConfig';

export class DepositHandler extends Handler {
  constructor(walletHandler, contractPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.contractPool = contractPool;
  }

  async createDeposit({ srcChainId, dstChainId, assetSymbol, bridge, amount, shieldedAddress }, signer) {
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
    const depositPromise = this._approveAsset(signer, deposit, depositContracts)
      .then(() => {
        return this._sendDeposit(signer, deposit, depositContracts);
      })
      .catch((error) => {
        deposit.errorMessage = toString(error);
        deposit.status = DepositStatus.FAILED;
        return this._updateDeposit(deposit);
      });
    return { deposit, depositPromise };
  }

  async _approveAsset(signer, deposit, { asset, protocol }) {
    if (asset) {
      const assetContract = asset.connect(signer.signer);
      const spenderAddress = protocol.address;
      const allowance = await asset.allowance(deposit.srcAddress, spenderAddress);
      const allowanceBN = new BN(allowance.toString());
      if (allowanceBN.lt(deposit.amount)) {
        const txResponse = await assetContract
          .approve(protocol.address, deposit.amount.toString())
          .catch((error) => {
            deposit.errorMessage = toString(error);
            return undefined;
          });
        if (!txResponse) {
          deposit.status = DepositStatus.FAILED;
          await this._updateDeposit(deposit);
          return;
        }
        deposit.status = DepositStatus.ASSET_APPROVING;
        deposit.assetApproveTxHash = txResponse.hash;
        await this._updateDeposit(deposit);
        await txResponse
          .wait()
          .then((txReceipt) => {
            deposit.status = DepositStatus.ASSET_APPROVED;
            deposit.assetApproveTxHash = txReceipt.transactionHash;
          })
          .catch((error) => {
            deposit.errorMessage = toString(error);
            deposit.status = DepositStatus.FAILED;
          });
      }
    } else {
      deposit.status = DepositStatus.ASSET_APPROVED;
    }
    await this._updateDeposit(deposit);
  }

  async _sendDeposit(signer, deposit, depositContracts) {
    if (deposit.status === DepositStatus.ASSET_APPROVED) {
      const protocolContract = await depositContracts.protocol.connect(signer.signer);
      const depositTxResponse = await protocolContract
        .deposit(
          deposit.amount.toString(),
          toFixedLenHex(deposit.commitmentHash),
          toFixedLenHex(deposit.hashK),
          toFixedLenHex(deposit.randomS),
          toHex(deposit.privateNote),
        )
        .catch((error) => {
          deposit.errorMessage = toString(error);
          return undefined;
        });
      if (!depositTxResponse) {
        deposit.status = DepositStatus.FAILED;
        return;
      }
      deposit.status = DepositStatus.SRC_PENDING;
      deposit.srcTxHash = depositTxResponse.hash;
      await this._updateDeposit(deposit);
      await depositTxResponse
        .wait()
        .then((txReceipt) => {
          deposit.status = DepositStatus.SRC_CONFIRMED;
          deposit.srcTxHash = txReceipt.transactionHash;
        })
        .catch((error) => {
          deposit.errorMessage = toString(error);
          deposit.status = DepositStatus.FAILED;
        });
      await this._updateDeposit(deposit);
      if (deposit.bridge === BridgeType.LOOP) {
        if (deposit.status === DepositStatus.SRC_CONFIRMED) {
          deposit.status = DepositStatus.SUCCEEDED;
          await this._updateDeposit(deposit);
        }
      }
    }
  }

  async _updateDeposit(deposit) {
    this.db.deposits.update(deposit.data);
    await this.saveDatabase();
    return deposit;
  }
}
