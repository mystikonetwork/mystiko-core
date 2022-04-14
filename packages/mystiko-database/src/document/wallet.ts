import { RxDocument } from 'rxdb';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { WalletType } from '../schema';

export type WalletMethods = {
  masterSeed: (protocol: MystikoProtocol, password: string) => string;
};

export type Wallet = RxDocument<WalletType, WalletMethods>;

export const walletMethods: WalletMethods = {
  masterSeed(this: Wallet, protocol: MystikoProtocol, password: string): string {
    return protocol.decryptSymmetric(password, this.encryptedMasterSeed);
  },
};
