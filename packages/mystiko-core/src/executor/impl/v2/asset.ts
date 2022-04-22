import { ERC20, MystikoContractFactory } from '@mystikonetwork/contracts-abi';
import { toBN } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import { AssetExecutor, AssetExecutorApproveOptions, AssetExecutorBalanceOptions } from '../../../interface';
import { MystikoExecutor } from '../../executor';

export class AssetExecutorV2 extends MystikoExecutor implements AssetExecutor {
  public approve(options: AssetExecutorApproveOptions): Promise<ethers.ContractTransaction | undefined> {
    if (!options.assetAddress) {
      return createErrorPromise(
        `invalid asset approve options ${options}, missing asset contract address`,
        MystikoErrorCode.INVALID_ASSET_APPROVE_OPTIONS,
      );
    }
    const { signer } = options.signer;
    const contract = MystikoContractFactory.connect<ERC20>('ERC20', options.assetAddress, signer);
    return signer
      .getAddress()
      .then((account) => contract.allowance(account, options.spender))
      .then((approvedAmount) => {
        if (toBN(approvedAmount.toString()).lt(toBN(options.amount))) {
          this.logger.info(
            'started submitting asset approving transaction ' +
              `chain id=${options.chainId}, asset=${options.assetSymbol}, amount=${options.amount}`,
          );
          return contract.approve(options.spender, options.amount);
        }
        return undefined;
      })
      .then((response) => {
        if (response) {
          this.logger.info(`asset approving transaction is submitted, transaction hash=${response.hash}`);
        }
        return response;
      });
  }

  public balance(options: AssetExecutorBalanceOptions): Promise<string> {
    const provider = this.context.providers.getProvider(options.chainId);
    if (!provider) {
      return createErrorPromise(
        `no provider configured for chain id=${options.chainId}`,
        MystikoErrorCode.NON_EXISTING_PROVIDER,
      );
    }
    if (options.assetAddress) {
      const contract = MystikoContractFactory.connect<ERC20>('ERC20', options.assetAddress, provider);
      return contract.balanceOf(options.address).then((b) => b.toString());
    }
    return provider.getBalance(options.address).then((b) => b.toString());
  }
}
