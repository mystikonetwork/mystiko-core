// eslint-disable-next-line max-classes-per-file
import { MystikoConfig } from '@mystikonetwork/config';
import { Commitment, initDatabase } from '@mystikonetwork/database';
import { ProviderPoolImpl } from '@mystikonetwork/ethers';
import { readJsonFile } from '@mystikonetwork/utils';
import { enforceOptions } from 'broadcast-channel';
import { ethers } from 'ethers';
import nock from 'nock';
import {
  AccountHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  CommitmentImport,
  ContractHandlerV2,
  createError,
  MystikoContextInterface,
  MystikoErrorCode,
  NullifierHandlerV2,
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
    const contracts = await this.context.contracts.find({ selector: { chainId } });
    const contractPromises = contracts.map((contract) =>
      contract.atomicUpdate((data) => {
        data.syncedBlockNumber = this.options.syncedBlockNumber || 50000000;
        return data;
      }),
    );
    await Promise.all(contractPromises);
    return [];
  }
}

const sepoliaCurrentBlock = 12240323;
const bscCurrentBlock = 19019080;

class TestProvider extends ethers.providers.JsonRpcProvider {
  private readonly chainId: number;

  constructor(url: string, chainId: number) {
    super(url, { chainId, name: 'Test Chain' });
    this.chainId = chainId;
  }

  public detectNetwork(): Promise<ethers.providers.Network> {
    return Promise.resolve({ chainId: this.chainId, name: 'Test Chain' });
  }

  public getBlockNumber(): Promise<number> {
    if (this.chainId === 11155111) {
      return Promise.resolve(sepoliaCurrentBlock);
    }
    return Promise.resolve(bscCurrentBlock);
  }
}

class TestProviderPool extends ProviderPoolImpl {
  public getProvider(chainId: number): Promise<ethers.providers.Provider | undefined> {
    return Promise.resolve(new TestProvider('http://localhost:8545', chainId));
  }
}

beforeAll(async () => {
  enforceOptions({
    type: 'simulate',
  });
  const config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  context = await createTestContext({
    config,
    providerPool: new TestProviderPool(config),
  });
  context.wallets = new WalletHandlerV2(context);
  context.chains = new ChainHandlerV2(context);
  context.contracts = new ContractHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
  context.nullifiers = new NullifierHandlerV2(context);
  nock('https://example.com').get(/.*/).reply(404, 'Not Found');
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
  await context.wallets.fullSynchronization(true);
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
  await expect(
    synchronizer.schedule({ walletPassword: 'wrong password', noPacker: true, skipAccountScan: true }),
  ).rejects.toThrow();
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
  await synchronizer.run({ walletPassword, noPacker: true, skipAccountScan: true });
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
  let accountScanning = false;
  let accountScanned = false;
  synchronizer.addListener(() => {
    accountScanning = true;
  }, SyncEventType.ACCOUNTS_SCANNING);
  const accountScannedPromise = new Promise<void>((resolve) => {
    synchronizer.addListener(() => {
      accountScanned = true;
      resolve();
    }, SyncEventType.ACCOUNTS_SCANNED);
  });
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
  await accountScannedPromise;
  status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe(undefined);
  expect(accountScanning).toBe(true);
  expect(accountScanned).toBe(true);
  status.chains.forEach((chainStatus) => {
    const chainConfig = context.config.getChainConfig(chainStatus.chainId);
    if (chainConfig) {
      const contractsCount = chainConfig.depositContracts.length + chainConfig.poolContracts.length;
      expect(chainStatus.isSyncing).toBe(false);
      expect(chainStatus.syncedBlock).toBe(contractsCount === 0 ? 0 : 50000000);
    }
  });
});

test('test run timeout', async () => {
  await synchronizer.run({ walletPassword, timeoutMs: 500, noPacker: true, skipAccountScan: true });
  const status = await synchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe('timeout after 500 ms');
});

test('test run with chain error', async () => {
  context.commitments = new MockCommitmentHandler({ raiseError: true });
  await synchronizer.run({ walletPassword, noPacker: true, skipAccountScan: true });
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
  await expect(
    synchronizer.schedule({ walletPassword, noPacker: true, skipAccountScan: true }),
  ).rejects.toThrow(
    createError('synchronizer has already been closed', MystikoErrorCode.SYNCHRONIZER_CLOSED),
  );
  await expect(synchronizer.run({ walletPassword, noPacker: true, skipAccountScan: true })).rejects.toThrow(
    createError('synchronizer has already been closed', MystikoErrorCode.SYNCHRONIZER_CLOSED),
  );
});

test('test close during running', async () => {
  let count = 0;
  const listener = () => {
    count += 1;
  };
  synchronizer.addListener(listener, SyncEventType.SYNCHRONIZED);
  const runPromise = synchronizer.run({ walletPassword, noPacker: true, skipAccountScan: true });
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
  const runPromise = synchronizer.run({ walletPassword, noPacker: true, skipAccountScan: true });
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
  await synchronizer.schedule({
    walletPassword,
    startDelayMs: 0,
    intervalMs: 500,
    noPacker: true,
    skipAccountScan: true,
  });
  resolves.forEach((resolve) => resolve());
  await promise;
  const status = await anotherSynchronizer.status;
  expect(status.isSyncing).toBe(false);
  expect(status.error).toBe(undefined);
  status.chains.forEach((chainStatus) => {
    const chainConfig = context.config.getChainConfig(chainStatus.chainId);
    if (chainConfig) {
      const contractsCount = chainConfig.depositContracts.length + chainConfig.poolContracts.length;
      expect(chainStatus.isSyncing).toBe(false);
      expect(chainStatus.syncedBlock).toBe(contractsCount === 0 ? 0 : 50000000);
    }
  });
  await anotherSynchronizer.close();
});
