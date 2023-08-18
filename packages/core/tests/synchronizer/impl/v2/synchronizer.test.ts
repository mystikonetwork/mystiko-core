import { MystikoConfig } from '@mystikonetwork/config';
import { Commitment, initDatabase } from '@mystikonetwork/database';
import { readJsonFile } from '@mystikonetwork/utils';
import { enforceOptions } from 'broadcast-channel';
import {
  AccountHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  CommitmentImport,
  ContractHandlerV2,
  createError,
  MystikoContextInterface,
  MystikoErrorCode,
  SyncEventType,
  SynchronizerV2,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let synchronizer: SynchronizerV2;
let promises: Map<number, Promise<void>>;
let resolves: Map<number, (value: void | PromiseLike<void>) => void>;
const walletPassword = 'P@ssw0rd';

export type MockOptions = {
  raiseError?: boolean;
  syncedBlockNumber?: number;
};

class MockCommitmentHandler extends CommitmentHandlerV2 {
  private readonly options: MockOptions;

  constructor(options?: MockOptions) {
    super(context);
    this.options = options || {};
  }

  public async import(importOptions: CommitmentImport): Promise<Commitment[]> {
    if (this.options.raiseError) {
      return Promise.reject(new Error('random error'));
    }
    const { chainId } = importOptions;
    if (!chainId) {
      return Promise.reject(new Error('chainId should not be undefined'));
    }
    const chain = await this.context.chains.findOne(chainId);
    if (!chain) {
      return Promise.reject(new Error('chain should not be null'));
    }
    const promise = promises.get(chainId);
    if (promise) {
      await promise;
    }
    return chain
      .update({ $set: { syncedBlockNumber: this.options.syncedBlockNumber || 50000000 } })
      .then(() => []);
  }
}

beforeAll(async () => {
  enforceOptions({
    type: 'simulate',
  });
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  context.wallets = new WalletHandlerV2(context);
  context.chains = new ChainHandlerV2(context);
  context.contracts = new ContractHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  const dbData = await readJsonFile('tests/files/database.unsync.test.json');
  await context.db.importJSON(dbData);
  context.commitments = new MockCommitmentHandler();
  synchronizer = new SynchronizerV2(context);
  promises = new Map<number, Promise<void>>();
  resolves = new Map<number, (value: void | PromiseLike<void>) => void>();
  context.config.chains.forEach((chainConfig) => {
    const promise = new Promise<void>((resolve) => {
      resolves.set(chainConfig.chainId, resolve);
    });
    promises.set(chainConfig.chainId, promise);
  });
});

afterEach(async () => {
  resolves.forEach((resolve) => resolve());
  await synchronizer.close();
  expect(synchronizer.closed).toBe(true);
});

afterAll(async () => {
  await context.db.remove();
});

test('test schedule', async () => {
  await expect(synchronizer.schedule({ walletPassword: 'wrong password' })).rejects.toThrow();
  let syncingCount = 0;
  let syncedCount = 0;
  let promise2: Promise<void> | undefined;
  const promise1 = new Promise<void>((resolve1) => {
    synchronizer.addListener(() => {
      syncingCount += 1;
      if (syncingCount === 1) {
        promise2 = new Promise<void>((resolve2) => {
          synchronizer.addListener(() => {
            syncedCount += 1;
            if (syncedCount === 2) {
              synchronizer.cancelSchedule();
              resolve2();
            }
          }, SyncEventType.SYNCHRONIZED);
        });
        resolve1();
      }
    }, SyncEventType.SYNCHRONIZING);
    synchronizer.schedule({ walletPassword, startDelayMs: 0, intervalMs: 1000 });
  });
  await promise1;
  const status = await synchronizer.status;
  expect(synchronizer.scheduled).toBe(true);
  expect(synchronizer.running).toBe(true);
  expect(status.isSyncing).toBe(true);
  if (!promise2) {
    throw new Error('promise2 should not undefined');
  }
  await synchronizer.run({ walletPassword });
  resolves.forEach((resolve) => resolve());
  await promise2;
  expect(synchronizer.scheduled).toBe(false);
  expect(synchronizer.running).toBe(false);
  expect(syncingCount).toBe(2);
  expect(syncedCount).toBe(2);
});

test('test run', async () => {
  await expect(synchronizer.run({ walletPassword: 'wrong password' })).rejects.toThrow();
  let runPromise: Promise<void> | undefined;
  let chainSyncingCount = 0;
  const syncingPromise = new Promise<void>((resolve) => {
    runPromise = synchronizer.run({ walletPassword });
    synchronizer.addListener(() => {
      chainSyncingCount += 1;
      if (chainSyncingCount === context.config.chains.length) {
        resolve();
      }
    }, SyncEventType.CHAIN_SYNCHRONIZING);
  });
  await syncingPromise;
  let status = await synchronizer.status;
  expect(status.isSyncing).toBe(true);
  expect(status.chains.map((c) => c.chainId).sort()).toStrictEqual(
    context.config.chains.map((c) => c.chainId).sort(),
  );
  status.chains.forEach((chainStatus) => expect(chainStatus.isSyncing).toBe(true));
  resolves.forEach((resolve) => resolve());
  if (!runPromise) {
    throw new Error('runPromise should not be undefined');
  }
  await runPromise;
  status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe(undefined);
  status.chains.forEach((chainStatus) => {
    expect(chainStatus.isSyncing).toBe(false);
    expect(chainStatus.syncedBlock).toBe(50000000);
  });
});

test('test run timeout', async () => {
  await synchronizer.run({ walletPassword, chainTimeoutMs: 500 });
  let status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe('some chain(s) failed to sync');
  expect(status.chains[0].error).toBe('timeout after 500 ms');
  await synchronizer.run({ walletPassword, timeoutMs: 500 });
  status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe('timeout after 500 ms');
});

test('test run with chain error', async () => {
  context.commitments = new MockCommitmentHandler({ raiseError: true });
  await synchronizer.run({ walletPassword });
  const status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe('some chain(s) failed to sync');
  status.chains.forEach((chainStatus) => {
    expect(chainStatus.isSyncing).toBe(false);
    expect(chainStatus.error).toBe('random error');
  });
});

test('test close', async () => {
  await synchronizer.close();
  await expect(synchronizer.schedule({ walletPassword })).rejects.toThrow(
    createError('synchronizer has already been closed', MystikoErrorCode.SYNCHRONIZER_CLOSED),
  );
  await expect(synchronizer.run({ walletPassword })).rejects.toThrow(
    createError('synchronizer has already been closed', MystikoErrorCode.SYNCHRONIZER_CLOSED),
  );
});

test('test close during running', async () => {
  let count = 0;
  const listener = () => {
    count += 1;
  };
  synchronizer.addListener(listener, SyncEventType.SYNCHRONIZED);
  const runPromise = synchronizer.run({ walletPassword });
  await synchronizer.close();
  resolves.forEach((resolve) => resolve());
  await runPromise;
  expect(count).toBe(0);
});

test('test removeListener', async () => {
  let count = 0;
  const listener = () => {
    count += 1;
  };
  synchronizer.addListener(listener, SyncEventType.SYNCHRONIZED);
  const runPromise = synchronizer.run({ walletPassword });
  synchronizer.removeListener(listener);
  resolves.forEach((resolve) => resolve());
  await runPromise;
  expect(count).toBe(0);
});

test('test broadcast channel', async () => {
  const anotherSynchronizer = new SynchronizerV2(context);
  const promise = new Promise<void>((resolve) => {
    anotherSynchronizer.addListener(() => resolve(), [SyncEventType.SYNCHRONIZED]);
  });
  await synchronizer.schedule({ walletPassword, startDelayMs: 0, intervalMs: 500 });
  resolves.forEach((resolve) => resolve());
  await promise;
  const status = await anotherSynchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe(undefined);
  status.chains.forEach((chainStatus) => {
    expect(chainStatus.isSyncing).toBe(false);
    expect(chainStatus.syncedBlock).toBe(50000000);
  });
  await anotherSynchronizer.close();
});
