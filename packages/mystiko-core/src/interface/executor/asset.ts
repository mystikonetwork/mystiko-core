import { ethers } from 'ethers';

export type AssetExecutorOptions = {
  chainId: number;
  assetAddress?: string;
  assetSymbols: string;
  assetDecimals: number;
};

export type AssetExecutorApproveOptions = AssetExecutorOptions & {
  amount: number;
  recipientAddress: string;
};

export type AssetExecutorBalanceOptions = AssetExecutorOptions & {
  address: string;
};

export interface AssetExecutor<A = AssetExecutorApproveOptions, B = AssetExecutorBalanceOptions> {
  approve(options: A): Promise<ethers.ContractTransaction>;
  balance(options: B): Promise<number>;
}
