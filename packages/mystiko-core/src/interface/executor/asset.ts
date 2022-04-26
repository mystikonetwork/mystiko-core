import { MystikoSigner } from '@mystikonetwork/ethers';
import { ethers } from 'ethers';

export type AssetExecutorOptions = {
  chainId: number;
  assetAddress?: string;
  assetSymbol: string;
  assetDecimals: number;
};

export type AssetExecutorApproveOptions = AssetExecutorOptions & {
  amount: string;
  spender: string;
  signer: MystikoSigner;
};

export type AssetExecutorBalanceOptions = AssetExecutorOptions & {
  address: string;
};

export interface AssetExecutor<A = AssetExecutorApproveOptions, B = AssetExecutorBalanceOptions> {
  approve(options: A): Promise<ethers.ContractTransaction | undefined>;
  balance(options: B): Promise<string>;
}
