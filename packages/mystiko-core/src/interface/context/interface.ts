import { MystikoConfig } from '@mystikonetwork/config';
import { SupportedContractType } from '@mystikonetwork/contracts-abi';
import { MystikoDatabase } from '@mystikonetwork/database';
import { ProviderPool } from '@mystikonetwork/ethers';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { ethers } from 'ethers';
import { ExecutorFactory } from '../executor';
import {
  AccountHandler,
  AssetHandler,
  ChainHandler,
  ContractHandler,
  CommitmentHandler,
  DepositHandler,
  TransactionHandler,
  WalletHandler,
} from '../handler';

export interface MystikoContractConnector {
  connect<T extends SupportedContractType>(
    contractName: string,
    address: string,
    signerOrProvider: ethers.Signer | ethers.providers.Provider,
  ): T;
}

export interface MystikoContextInterface<
  A extends AccountHandler = AccountHandler,
  AS extends AssetHandler = AssetHandler,
  CH extends ChainHandler = ChainHandler,
  CO extends ContractHandler = ContractHandler,
  CM extends CommitmentHandler = CommitmentHandler,
  D extends DepositHandler = DepositHandler,
  T extends TransactionHandler = TransactionHandler,
  W extends WalletHandler = WalletHandler,
  P extends MystikoProtocol = MystikoProtocol,
> {
  get config(): MystikoConfig;
  set config(conf: MystikoConfig);
  get db(): MystikoDatabase;
  set db(database: MystikoDatabase);
  get protocol(): P;
  set protocol(p: P);
  get accounts(): A;
  set accounts(handler: A);
  get assets(): AS;
  set assets(handler: AS);
  get chains(): CH;
  set chains(handler: CH);
  get commitments(): CM;
  set commitments(handler: CM);
  get contracts(): CO;
  set contracts(handler: CO);
  get deposits(): D;
  set deposits(handler: D);
  get transactions(): T;
  set transactions(handler: T);
  get wallets(): W;
  set wallets(handler: W);
  get executors(): ExecutorFactory;
  set executors(factory: ExecutorFactory);
  get providers(): ProviderPool;
  set providers(pool: ProviderPool);
  get contractConnector(): MystikoContractConnector;
  set contractConnector(connector: MystikoContractConnector);
}
