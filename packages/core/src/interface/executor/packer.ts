import { Commitment } from '@mystikonetwork/database';

export type PackerImportOptions = {
  walletPassword: string;
  chainId: number;
  timeoutMs?: number;
  contractAddresses?: string[];
};

export type PackerImportResult = {
  commitments: Commitment[];
  syncedBlock: number;
};

export interface PackerExecutor<IO = PackerImportOptions, IR = PackerImportResult> {
  import(options: IO): Promise<IR>;
}
