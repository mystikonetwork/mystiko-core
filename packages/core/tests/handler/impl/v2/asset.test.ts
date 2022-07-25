import { BridgeType, MystikoConfig } from '@mystikonetwork/config';
import { CommitmentStatus, initDatabase } from '@mystikonetwork/database';
import { readJsonFile } from '@mystikonetwork/utils';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  MystikoContextInterface,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let context: MystikoContextInterface;
let handler: AssetHandlerV2;

beforeAll(async () => {
  context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  context.wallets = new WalletHandlerV2(context);
  context.chains = new ChainHandlerV2(context);
  context.accounts = new AccountHandlerV2(context);
  context.commitments = new CommitmentHandlerV2(context);
  handler = new AssetHandlerV2(context);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  const dbData = await readJsonFile('tests/files/database.sync.test.json');
  await context.db.importJSON(dbData);
});

afterAll(async () => {
  await context.db.remove();
});

test('test chains', async () => {
  let chains = await handler.chains();
  expect(chains.map((c) => c.chainId).sort()).toStrictEqual([3, 97]);
  const chain = await context.chains.findOne(3);
  await chain?.remove();
  chains = await handler.chains();
  expect(chains.map((c) => c.chainId).sort()).toStrictEqual([97]);
});

test('test assets', async () => {
  let assets = await handler.assets(1024);
  expect(assets).toStrictEqual([]);
  assets = await handler.assets(3);
  expect(assets.sort()).toStrictEqual(['MTT']);
  assets = await handler.assets(97);
  expect(assets.sort()).toStrictEqual(['BNB', 'MTT']);
});

test('test bridges', async () => {
  let bridges = await handler.bridges(1024, 'MTT');
  expect(bridges).toStrictEqual([]);
  bridges = await handler.bridges(3, 'mUSD');
  expect(bridges).toStrictEqual([]);
  bridges = await handler.bridges(3, 'MTT');
  expect(bridges).toStrictEqual([BridgeType.TBRIDGE]);
  bridges = await handler.bridges(97, 'BNB');
  expect(bridges).toStrictEqual([BridgeType.LOOP]);
});

test('test pools', async () => {
  let pools = await handler.pools(3, 'MTT', BridgeType.LOOP);
  expect(pools).toStrictEqual([]);
  pools = await handler.pools(3, 'MTT', BridgeType.TBRIDGE);
  expect(pools.map((c) => c.address)).toStrictEqual(['0xeb2a6545516ce618807c07BB04E9CCb8ED7D8e6F']);
  pools = await handler.pools(97, 'BNB', BridgeType.LOOP);
  expect(pools.map((c) => c.address)).toStrictEqual(['0xae5009F4B58E6eF25Fee71174A827042c543ac46']);
});

test('test balance', async () => {
  let balance = await handler.balance({ asset: 'mUSD' });
  expect(balance.unspentTotal).toBe(0);
  expect(balance.pendingTotal).toBe(0);
  balance = await handler.balance({ asset: 'MTT' });
  expect(balance.unspentTotal).toBe(19.9);
  expect(balance.pendingTotal).toBe(0);
  balance = await handler.balance({ asset: 'BNB' });
  expect(balance.unspentTotal).toBe(0.2);
  expect(balance.pendingTotal).toBe(0);
  const accounts = await context.accounts.find();
  const commitments = await context.commitments.find({
    selector: {
      shieldedAddress: { $in: accounts.map((a) => a.shieldedAddress) },
      status: CommitmentStatus.INCLUDED,
      chainId: 97,
      assetSymbol: 'BNB',
    },
  });
  const promises = commitments.map((c) => c.update({ $set: { status: CommitmentStatus.QUEUED } }));
  await Promise.all(promises);
  balance = await handler.balance({ chainId: 97, asset: 'BNB' });
  expect(balance.unspentTotal).toBe(0);
  expect(balance.pendingTotal).toBe(0.2);
});

test('test balances', async () => {
  let balances = await handler.balances({
    chainId: 97,
    assets: ['BNB'],
    contractAddress: '0xae5009F4B58E6eF25Fee71174A827042c543ac46',
    shieldedAddress:
      'EWwpfC6wxg3RA71cHimWonUfSPwZF3hjjHATdzN5hEidjLod3gEy3NNZVC8uXtzrrYPjZXCvNCDm7Pnuyd4hpxkkP',
    bridgeType: BridgeType.LOOP,
  });
  expect(balances.size).toBe(1);
  expect(balances.get('BNB')?.unspentTotal).toBe(0.2);
  expect(balances.get('BNB')?.pendingTotal).toBe(0);
  balances = await handler.balances({
    chainId: [3, 97],
    assets: ['BNB', 'MTT'],
    bridgeType: [BridgeType.LOOP],
  });
  expect(balances.size).toBe(2);
  expect(balances.get('MTT')?.unspentTotal).toBe(10);
  expect(balances.get('MTT')?.pendingTotal).toBe(0);
  expect(balances.get('BNB')?.unspentTotal).toBe(0.2);
  expect(balances.get('BNB')?.pendingTotal).toBe(0);
  balances = await handler.balances({
    chainId: [97],
    contractAddress: ['0xae5009F4B58E6eF25Fee71174A827042c543ac46'],
    shieldedAddress: ['wrong address'],
  });
  expect(balances.size).toBe(0);
  balances = await handler.balances();
  expect(balances.get('MTT')?.unspentTotal).toBe(19.9);
  expect(balances.get('MTT')?.pendingTotal).toBe(0);
  expect(balances.get('BNB')?.unspentTotal).toBe(0.2);
  expect(balances.get('BNB')?.pendingTotal).toBe(0);
});

test('test skip removed contract', async () => {
  const rawConfig = context.config.copyData();
  const rawChainConfig = rawConfig.chains.filter((c) => c.chainId === 97)[0];
  rawChainConfig.depositContracts = rawChainConfig.depositContracts.filter(
    (c) => c.address !== '0x4471873169EA7cd3f45beA9105f567Bdc8608240',
  );
  rawChainConfig.poolContracts = rawChainConfig.poolContracts.filter(
    (c) => c.address !== '0xae5009F4B58E6eF25Fee71174A827042c543ac46',
  );
  context.config = await MystikoConfig.createFromRaw(rawConfig);
  const balances = await handler.balances();
  expect(balances.size).toBe(1);
  expect(balances.get('MTT')?.unspentTotal).toBe(19.9);
  expect(balances.get('MTT')?.pendingTotal).toBe(0);
  const balance = await handler.balance({ asset: 'BNB' });
  expect(balance.unspentTotal).toBe(0);
  expect(balance.pendingTotal).toBe(0);
});
