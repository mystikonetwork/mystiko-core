import { ethers } from 'ethers';

export type AssetExecutorOptions = {
  chainId: number;
  assetAddress?: string;
};

export type AssetExecutorApproveOptions = AssetExecutorOptions & {
  assetSymbol: string;
  assetDecimals: number;
  amount: string;
  spender: string;
  signer: ethers.Signer;
};

export type AssetExecutorBalanceOptions = AssetExecutorOptions & {
  address: string;
};

export interface AssetExecutor<A = AssetExecutorApproveOptions, B = AssetExecutorBalanceOptions> {
  approve(options: A): Promise<ethers.ContractTransaction | undefined>;
  balance(options: B): Promise<string>;
}
