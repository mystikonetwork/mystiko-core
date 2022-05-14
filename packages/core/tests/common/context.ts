import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import { MystikoProtocolV2, ProtocolFactoryV2 } from '@mystikonetwork/protocol';
import { ProviderConnection, ProviderFactory } from '@mystikonetwork/utils';
import { ZKProverFactory } from '@mystikonetwork/zkp';
import { ZokratesCliProverFactory } from '@mystikonetwork/zkp-node';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  ContractHandlerV2,
  DepositHandlerV2,
  ExecutorFactoryV2,
  MystikoContext,
  MystikoContractConnector,
  TransactionHandlerV2,
  WalletHandlerV2,
} from '../../src';
import { NullifierHandlerV2 } from '../../src/handler/impl/v2/nullifier';

export type TestContextOptions = {
  db?: MystikoDatabase;
  config?: MystikoConfig;
  providerConfigGetter?: (chain: number) => Promise<ProviderConnection[]>;
  providerPool?: ProviderPool;
  providerFactory?: ProviderFactory;
  contractConnector?: MystikoContractConnector;
};

export async function createTestContext(
  options?: TestContextOptions,
): Promise<
  MystikoContext<
    AccountHandlerV2,
    AssetHandlerV2,
    ChainHandlerV2,
    ContractHandlerV2,
    CommitmentHandlerV2,
    DepositHandlerV2,
    NullifierHandlerV2,
    TransactionHandlerV2,
    WalletHandlerV2,
    MystikoProtocolV2
  >
> {
  const { db, config, providerConfigGetter, providerPool, providerFactory, contractConnector } =
    options || {};
  let wrappedConfig = config;
  if (!wrappedConfig) {
    wrappedConfig = await MystikoConfig.createFromPlain({
      version: '0.1.0',
    });
  }
  let wrappedDb = db;
  if (!wrappedDb) {
    wrappedDb = await initDatabase();
  }
  const proverFactory: ZKProverFactory = new ZokratesCliProverFactory();
  const protocolFactory = new ProtocolFactoryV2(proverFactory);
  const protocol = await protocolFactory.create();
  const context = new MystikoContext<
    AccountHandlerV2,
    AssetHandlerV2,
    ChainHandlerV2,
    ContractHandlerV2,
    CommitmentHandlerV2,
    DepositHandlerV2,
    NullifierHandlerV2,
    TransactionHandlerV2,
    WalletHandlerV2,
    MystikoProtocolV2
  >(wrappedConfig, wrappedDb, protocol);
  context.executors = new ExecutorFactoryV2(context);
  if (providerPool) {
    context.providers = providerPool;
  } else {
    context.providers = new ProviderPoolImpl(wrappedConfig, providerConfigGetter, providerFactory);
  }
  if (contractConnector) {
    context.contractConnector = contractConnector;
  }
  return Promise.resolve(context);
}
