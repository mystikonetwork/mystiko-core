import { ethers } from 'ethers';
import { Handler } from './handler.js';
import { check, toDecimals, toHex, toFixedLenHex } from '../utils.js';
import { createContract, validContractConfig } from '../chain/contract.js';
import { Deposit, DepositStatus } from '../model/deposit.js';
import { Wallet } from '../model/wallet.js';

export class DepositHandler extends Handler {
  constructor(db, config) {
    super(db, config);
  }

  async createDeposit(wallet, signer, srcChainId, dstChainId, tokenSymbol, bridge, amount, shieldedAddress) {
    check(wallet instanceof Wallet, 'wallet should be instance of Wallet');
    check(signer instanceof ethers.Signer, 'incorrect signer instance');
    check(typeof amount === 'number', 'type of amount should be number');
    check(this.protocol.isShieldedAddress(shieldedAddress), shieldedAddress + ' is invalid shielded address');
    const contractConfig = this.config.getContractConfig(srcChainId, dstChainId, tokenSymbol, bridge);
    check(contractConfig, 'contract config gives nothing');
    const signerChainId = await signer.getChainId();
    check(srcChainId === signerChainId, 'signer chain id does not match srcChainId');
    const contract = await createContract(contractConfig, signer);
    await validContractConfig(contractConfig, contract);
    const amountDecimals = toDecimals(amount, contractConfig.assetDecimals);
    const { commitmentHash, privateNote, k, randomS } = await this.protocol.commitmentWithShieldedAddress(
      shieldedAddress,
      amountDecimals,
    );
    const srcAddress = await signer.getAddress();
    const deposit = new Deposit({});
    deposit.srcChainId = srcChainId;
    deposit.dstChainId = dstChainId;
    deposit.bridge = bridge;
    deposit.asset = contractConfig.assetSymbol;
    deposit.amount = amountDecimals;
    deposit.commitmentHash = this.protocol.bigIntToBuff(commitmentHash);
    deposit.srcAddress = srcAddress;
    deposit.walletId = wallet.id;
    deposit.status = DepositStatus.INIT;
    this.db.deposits.insert(deposit.data);
    await this.saveDatabase();
    contract
      .deposit(
        amountDecimals,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS),
        toHex(privateNote),
      )
      .then((txResponse) => {
        deposit.status = DepositStatus.SRC_PENDING;
        deposit.transactionHash = txResponse.hash;
        this.db.deposits.update(deposit.data);
        return txResponse.wait();
      })
      .then((receipt) => {
        deposit.transactionHash = receipt.transactionHash;
        deposit.status = DepositStatus.SRC_SUCCEEDED;
        this.db.deposits.update(deposit);
        return this.saveDatabase();
      })
      .catch((error) => {
        if (error && error.transactionHash) {
          deposit.transactionHash = error.transactionHash;
        }
        deposit.status = DepositStatus.SRC_FAILED;
        this.db.deposits.update(deposit);
        return this.saveDatabase();
      });
    return deposit;
  }
}
