import { ERC20 } from '@mystikonetwork/contracts-abi';
import { fromDecimals, toBN } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  AssetExecutor,
  AssetExecutorAllowanceOptions,
  AssetExecutorApproveOptions,
  AssetExecutorBalanceOptions,
} from '../../../interface';
import { MystikoExecutor } from '../../executor';

export class AssetExecutorV2 extends MystikoExecutor implements AssetExecutor {
  public approve(options: AssetExecutorApproveOptions): Promise<ethers.ContractTransaction | undefined> {
    if (!options.assetAddress) {
      return createErrorPromise(
        `invalid asset approve options ${options}, missing asset contract address`,
        MystikoErrorCode.INVALID_ASSET_APPROVE_OPTIONS,
      );
    }
    const { signer } = options;
    const contract = this.context.contractConnector.connect<ERC20>('ERC20', options.assetAddress, signer);
    return signer
      .getAddress()
      .then((account) => contract.allowance(account, options.spender))
      .then((approvedAmount) => {
        if (toBN(approvedAmount.toString()).lt(toBN(options.amount))) {
          const amountNumber = fromDecimals(options.amount, options.assetDecimals);
          this.logger.info(
            'started submitting asset approving transaction ' +
              `chain id=${options.chainId}, asset=${options.assetSymbol}, amount=${amountNumber}`,
          );
          return options.overrides
            ? contract.approve(options.spender, options.amount, options.overrides)
            : contract.approve(options.spender, options.amount);
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
    return this.context.providers.checkProvider(options.chainId).then((provider) => {
      if (options.assetAddress) {
        const contract = this.context.contractConnector.connect<ERC20>(
          'ERC20',
          options.assetAddress,
          provider,
        );
        return contract.balanceOf(options.address).then((b) => b.toString());
      }
      return provider.getBalance(options.address).then((b) => b.toString());
    });
  }

  public async allowance(options: AssetExecutorAllowanceOptions): Promise<string> {
    const provider = await this.context.providers.checkProvider(options.chainId);
    const contract = this.context.contractConnector.connect<ERC20>('ERC20', options.assetAddress, provider);
    const allowance = await contract.allowance(options.address, options.spender);
    return allowance.toString();
  }
}
