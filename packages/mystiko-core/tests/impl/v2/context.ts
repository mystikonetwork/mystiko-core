import { MystikoConfig } from '@mystikonetwork/config';
import { initDatabase, MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocolV2, ZokratesWasmRuntime } from '@mystikonetwork/protocol';
import { MystikoContext } from '../../../src/context';
import {
  AccountHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  DepositHandlerV2,
  TransactionHandlerV2,
  WalletHandlerV2,
} from '../../../src';

export async function createTestContext(
  db?: MystikoDatabase,
  config?: MystikoConfig,
): Promise<
  MystikoContext<
    AccountHandlerV2,
    ChainHandlerV2,
    CommitmentHandlerV2,
    DepositHandlerV2,
    TransactionHandlerV2,
    WalletHandlerV2,
    MystikoProtocolV2
  >
> {
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
  const runtime = new ZokratesWasmRuntime(zokrates);
  const protocol = new MystikoProtocolV2(runtime);
  const context = new MystikoContext<
    AccountHandlerV2,
    ChainHandlerV2,
    CommitmentHandlerV2,
    DepositHandlerV2,
    TransactionHandlerV2,
    WalletHandlerV2,
    MystikoProtocolV2
  >(wrappedConfig, wrappedDb, protocol);
  return Promise.resolve(context);
}
