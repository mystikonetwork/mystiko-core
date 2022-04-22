import { ethers } from 'ethers';
import { AssetExecutor, AssetExecutorApproveOptions, AssetExecutorBalanceOptions } from '../../../interface';
import { MystikoExecutor } from '../../executor';

export class AssetExecutorV2 extends MystikoExecutor implements AssetExecutor {
  public approve(options: AssetExecutorApproveOptions): Promise<ethers.ContractTransaction> {
    return Promise.reject(new Error('not implemented'));
  }

  public balance(options: AssetExecutorBalanceOptions): Promise<number> {
    return Promise.reject(new Error('not implemented'));
  }
}
