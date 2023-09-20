export type ChainStatus = {
  support: boolean;
  available: boolean;
  chainId?: number;
  relayerContractAddress?: string;
  contracts?: Contracts[];
};

export type Contracts = {
  assetSymbol: string;
  relayerFeeOfTenThousandth: number;
  minimumGasFee: string;
};
