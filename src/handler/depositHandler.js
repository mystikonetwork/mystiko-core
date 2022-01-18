import BN from 'bn.js';

import { Handler } from './handler.js';
import { check, toDecimals } from '../utils.js';
import { ContractPool } from '../chain/contract.js';
import { WalletHandler } from './walletHandler.js';

export class DepositHandler extends Handler {
  constructor(walletHandler, contractPool, db, config) {
    super(db, config);
    check(walletHandler instanceof WalletHandler, 'walletHandler should be instance of WalletHandler');
    check(contractPool instanceof ContractPool, 'contractPool should be instance of ContractPool');
    this.walletHandler = walletHandler;
    this.contractPool = contractPool;
  }

  async approveAsset(signer, srcChainId, dstChainId, assetSymbol, bridge, amount) {
    check(typeof amount === 'number', 'amount is invalid number');
    const depositContracts = this.contractPool.getDepositContracts(
      srcChainId,
      dstChainId,
      assetSymbol,
      bridge,
    );
    if (depositContracts.asset) {
      const assetContract = depositContracts.asset.connect(signer);
      const ownerAddress = await signer.getAddress();
      const spenderAddress = depositContracts.protocol.address;
      const allowance = await depositContracts.asset.allowance(ownerAddress, spenderAddress);
      const allowanceBN = new BN(allowance);
      const decimals = await assetContract.decimals();
      let amountBN = toDecimals(amount, decimals);
      if (allowanceBN.lt(amountBN)) {
        amountBN = amountBN.sub(allowanceBN);
        const txResp = await assetContract.approve(depositContracts.protocol.address, amountBN);
        return txResp.wait().then(
          () => true,
          () => false,
        );
      }
    }
    return true;
  }
}
