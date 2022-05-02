import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { ProviderPool, ProviderPoolImpl } from '@mystikonetwork/ethers';
import { MystikoProtocolV2, ZokratesCliRuntime, ZokratesWasmRuntime } from '@mystikonetwork/protocol';
import { ProviderConnection, ProviderFactory } from '@mystikonetwork/utils';
import commandExists from 'command-exists';
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
  // eslint-disable-next-line global-require
  const { initialize } = require('zokrates-js/node');
  const zokrates = await initialize();
  const runtime = await commandExists('zokrates')
    .then(() => new ZokratesCliRuntime(zokrates))
    .catch(() => new ZokratesWasmRuntime(zokrates));
  const protocol = new MystikoProtocolV2(runtime);
  const context = new MystikoContext<
    AccountHandlerV2,
    AssetHandlerV2,
    ChainHandlerV2,
    ContractHandlerV2,
    CommitmentHandlerV2,
    DepositHandlerV2,
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
