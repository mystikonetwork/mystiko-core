import { RxDatabase } from 'rxdb';
import { WalletCollection } from '../collection';

export type MystikoClientCollections = {
  wallets: WalletCollection;
};

export type MystikoClientDatabase = RxDatabase<MystikoClientCollections>;
