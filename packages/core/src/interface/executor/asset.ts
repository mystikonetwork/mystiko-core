import { ethers, Overrides } from 'ethers';

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
  overrides?: Overrides & { from?: string | Promise<string> };
};

export type AssetExecutorBalanceOptions = AssetExecutorOptions & {
  address: string;
};

export type AssetExecutorAllowanceOptions = {
  chainId: number;
  assetAddress: string;
  address: string;
  spender: string;
};

export interface AssetExecutor<
  A = AssetExecutorApproveOptions,
  B = AssetExecutorBalanceOptions,
  C = AssetExecutorAllowanceOptions,
> {
  approve(options: A): Promise<ethers.ContractTransaction | undefined>;
  balance(options: B): Promise<string>;
  allowance(options: C): Promise<string>;
}
