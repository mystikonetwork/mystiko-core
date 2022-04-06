import { toDecimals } from '@mystikonetwork/utils';

export const MerkleTreeHeight = 20;
export const RootHistoryLength = 30;
export const MinBridgeFee = 1000;
export const MinExecutorFee = 30000000000;
export const MinRollupFee = 20000000000;

export const BridgeAccountIndex = 5;
export const RollupAccountIndex1 = 6;
export const RollupAccountIndex2 = 7;

export const SourceChainID = 1001;
export const DestinationChainID = 1002;

export const DefaultTokenAmount = toDecimals(100000).toString();
export const DefaultPoolAmount = toDecimals(100).toString();

export const UserPrivKeys = [
  '0x41b465ba584342fb56d216e21ed8df756e50b277056eb30001984c68aac1be38',
  '0xe97e169ed64e902991b0699fb124bd42d2392065eb5a3640f878c5c9aeda1d6f',
  '0x6db9f1f24f40faf2420bbdce64660050809e519496ca3a584783423bfa6e7073',
];
