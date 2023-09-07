// eslint-disable-next-line max-classes-per-file
import { BridgeType, MystikoConfig } from '@mystikonetwork/config';
import { CommitmentPool__factory } from '@mystikonetwork/contracts-abi';
import { CommitmentStatus, ContractType, DepositStatus, initDatabase } from '@mystikonetwork/database';
import { FetchOptions } from '@mystikonetwork/datapacker-client/build/cjs/v1/client';
import { data } from '@mystikonetwork/protos';
import { readJsonFile, toBN, toBuff } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  CommitmentHandlerV2,
  ContractHandlerV2,
  DepositHandlerV2,
  MystikoContext,
  NullifierHandlerV2,
  PackerExecutorV2,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';
import { AllEvents, loadEvents } from '../../../common/event';

let testEvents: AllEvents;
let config: MystikoConfig;
let context: MystikoContext;
const walletPassword = 'P@ssw0rd';
let walletHandler: WalletHandlerV2;
let accountHandler: AccountHandlerV2;
let chainHandler: ChainHandlerV2;
let contractHandler: ContractHandlerV2;
let commitmentHandler: CommitmentHandlerV2;
let nullifierHandler: NullifierHandlerV2;
let depositHandler: DepositHandlerV2;
let assetHandler: AssetHandlerV2;

const sepoliaCurrentBlock = 12240323;
const bscCurrentBlock = 19019080;

function mergeCommitments(commitments: data.v1.Commitment[], threshold: number): data.v1.Commitment[] {
  const sortedCommitments = commitments.sort((a, b) => {
    const commitmentHashA = toBN(a.commitmentHash, 10, 'le');
    const commitmentHashB = toBN(b.commitmentHash, 10, 'le');
    if (commitmentHashA.eq(commitmentHashB)) {
      return a.status - b.status;
    }
    if (commitmentHashA.gt(commitmentHashB)) {
      return 1;
    }
    return -1;
  });
  let remaining = threshold;
  let index = 0;
  const mergedCommitments: data.v1.Commitment[] = [];
  while (index < commitments.length) {
    const commitment = sortedCommitments[index];
    if (index < commitments.length - 1) {
      const nextCommitment = sortedCommitments[index + 1];
      if (
        toBN(commitment.commitmentHash, 10, 'le').eq(toBN(nextCommitment.commitmentHash, 10, 'le')) &&
        remaining > 0
      ) {
        commitment.status = nextCommitment.status;
        commitment.includedBlockNumber = nextCommitment.includedBlockNumber;
        commitment.includedTransactionHash = nextCommitment.includedTransactionHash;
        index += 2;
        remaining -= 1;
      } else {
        index += 1;
      }
    } else {
      index += 1;
    }
    mergedCommitments.push(commitment);
  }
  return mergedCommitments;
}

function buildChainData(
  events: AllEvents,
  chainId: number,
  startBlock: number,
  endBlock: number,
): data.v1.ChainData {
  const chainEvents = events[chainId];
  const contractsData: data.v1.ContractData[] = [];
  const commitmentPoolAbi = new ethers.utils.Interface(CommitmentPool__factory.abi);
  Object.keys(chainEvents).forEach((contractAddress) => {
    const contractEvents = chainEvents[contractAddress];
    const commitments: data.v1.Commitment[] = [];
    const nullifiers: data.v1.Nullifier[] = [];
    Object.keys(contractEvents).forEach((eventName) => {
      contractEvents[eventName].forEach((event) => {
        const parsedEvent = commitmentPoolAbi.parseLog(event);
        if (eventName === 'CommitmentQueued') {
          commitments.push(
            new data.v1.Commitment({
              blockNumber: BigInt(event.blockNumber),
              status: data.v1.CommitmentStatus.QUEUED,
              commitmentHash: toBN(parsedEvent.args.commitment.toString()).toBuffer('le'),
              leafIndex: BigInt(parsedEvent.args.leafIndex.toNumber()),
              rollupFee: toBN(parsedEvent.args.rollupFee.toString()).toBuffer('le'),
              encryptedNote: toBuff(parsedEvent.args.encryptedNote),
              queuedTransactionHash: toBuff(event.transactionHash),
            }),
          );
        } else if (eventName === 'CommitmentIncluded') {
          commitments.push(
            new data.v1.Commitment({
              blockNumber: BigInt(event.blockNumber),
              includedBlockNumber: BigInt(event.blockNumber),
              status: data.v1.CommitmentStatus.INCLUDED,
              commitmentHash: toBN(parsedEvent.args.commitment.toString()).toBuffer('le'),
              includedTransactionHash: toBuff(event.transactionHash),
            }),
          );
        } else if (eventName === 'CommitmentSpent') {
          nullifiers.push(
            new data.v1.Nullifier({
              blockNumber: BigInt(event.blockNumber),
              nullifier: toBN(parsedEvent.args.serialNumber.toString()).toBuffer('le'),
              transactionHash: toBuff(event.transactionHash),
            }),
          );
        }
      });
    });
    config.getChainConfig(chainId)?.depositContractsWithDisabled?.forEach((depositContract) => {
      contractsData.push(
        new data.v1.ContractData({
          contractAddress: toBuff(depositContract.address),
          commitments: [],
          nullifiers: [],
        }),
      );
    });
    contractsData.push(
      new data.v1.ContractData({
        contractAddress: toBuff(contractAddress),
        commitments: mergeCommitments(commitments, 10),
        nullifiers,
      }),
    );
  });
  return new data.v1.ChainData({
    startBlock: BigInt(startBlock),
    endBlock: BigInt(endBlock),
    contractData: contractsData,
  });
}

class TestPackerClient {
  public chainId: number;

  public startBlock: number;

  public endBlock: number;

  constructor(chainId: number, startBlock: number, endBlock: number) {
    this.chainId = chainId;
    this.startBlock = startBlock;
    this.endBlock = endBlock;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fetch(options: FetchOptions): Promise<data.v1.ChainData | undefined> {
    return Promise.resolve(buildChainData(testEvents, this.chainId, this.startBlock, this.endBlock));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public savedBlock(chainId: number): Promise<number> {
    if (this.chainId === 11155111) {
      return Promise.resolve(sepoliaCurrentBlock);
    }
    return Promise.resolve(bscCurrentBlock);
  }
}

beforeAll(async () => {
  testEvents = await loadEvents('tests/files/events.test.json');
  config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  context = await createTestContext({
    config,
  });
  walletHandler = new WalletHandlerV2(context);
  accountHandler = new AccountHandlerV2(context);
  chainHandler = new ChainHandlerV2(context);
  contractHandler = new ContractHandlerV2(context);
  commitmentHandler = new CommitmentHandlerV2(context);
  nullifierHandler = new NullifierHandlerV2(context);
  depositHandler = new DepositHandlerV2(context);
  assetHandler = new AssetHandlerV2(context);
});

beforeEach(async () => {
  await context.db.remove();
  context.db = await initDatabase();
  const databaseData = await readJsonFile('tests/files/database.unsync.test.json');
  await context.db.importJSON(databaseData);
  expect(context.wallets).toBe(walletHandler);
  expect(context.accounts).toBe(accountHandler);
});

test('test import', async () => {
  const packerClient = new TestPackerClient(97, 18759679, bscCurrentBlock - 8000);
  const executor = new PackerExecutorV2(context, packerClient);
  await executor.import({ walletPassword, chainId: 97 });
  packerClient.chainId = 11155111;
  packerClient.startBlock = 12221050;
  packerClient.endBlock = sepoliaCurrentBlock - 8000;
  await executor.import({ walletPassword, chainId: 11155111 });
  await commitmentHandler.scanAll({ walletPassword });
  expect((await commitmentHandler.find()).length).toBe(72);
  expect((await nullifierHandler.find()).length).toBe(44);
  expect((await chainHandler.findOne(11155111))?.syncedBlockNumber).toBe(sepoliaCurrentBlock - 8000);
  expect((await chainHandler.findOne(97))?.syncedBlockNumber).toBe(bscCurrentBlock - 8000);
  const contracts = await contractHandler.find();
  for (let i = 0; i < contracts.length; i += 1) {
    const contract = contracts[i];
    expect(contract.syncedBlockNumber).toBe(
      contract.chainId === 11155111 ? sepoliaCurrentBlock - 8000 : bscCurrentBlock - 8000,
    );
  }
  const deposits = await depositHandler.find();
  const commitmentPromises: Promise<void>[] = [];
  for (let i = 0; i < deposits.length; i += 1) {
    const deposit = deposits[i];
    expect(deposit.status).toBe(DepositStatus.INCLUDED);
    commitmentPromises.push(
      commitmentHandler
        .findOne({
          chainId: deposit.dstChainId,
          contractAddress: deposit.dstPoolAddress,
          commitmentHash: deposit.commitmentHash,
        })
        .then((commitment) => {
          if (!commitment) {
            throw new Error('commitment should not be null here');
          }
          expect(deposit.rollupTransactionHash).toBe(commitment.rollupTransactionHash);
          if (deposit.bridgeType !== BridgeType.LOOP) {
            expect(deposit.relayTransactionHash).toBe(commitment.creationTransactionHash);
          } else {
            expect(deposit.transactionHash).toBe(commitment.creationTransactionHash);
          }
        }),
    );
  }
  await Promise.all(commitmentPromises);
  let commitment = await commitmentHandler.findOne('01G1Z1HCC34BGZRKCFJ274DVRK');
  expect(commitment?.status).toBe(CommitmentStatus.SPENT);
  expect(commitment?.spendingTransactionHash).toBe(
    '0xcce27527168596c3749509ee745eb38ee14e75db7b234d731d36353aa297a4f7',
  );
  commitment = await commitmentHandler.findOne('01G1Z1FW6T2SCHNJPFBGPDD2CA');
  expect(commitment?.status).toBe(CommitmentStatus.INCLUDED);
  commitment = await commitmentHandler.findOne('01G1YZD76WESAPZCHZB61QRNVZ');
  expect(commitment?.status).toBe(CommitmentStatus.INCLUDED);
  commitment = await commitmentHandler.findOne('01G1YZ9CDPRGHDQ0C8VH8XAWWF');
  expect(commitment?.status).toBe(CommitmentStatus.INCLUDED);
  commitment = await commitmentHandler.findOne({
    chainId: 11155111,
    contractAddress: '0xeb2a6545516ce618807c07BB04E9CCb8ED7D8e6F',
    commitmentHash: '11180465719024310907677069927739127182050210721078823347787007200803871969694',
  });
  expect(commitment?.amount).toBe('5000000000000000000');
  expect(commitment?.leafIndex).toBe('4');
  expect(commitment?.serialNumber).not.toBe(undefined);
  expect(commitment?.encryptedNote).not.toBe(undefined);
  const balances = await assetHandler.balances();
  expect(balances.get('MTT')?.unspentTotal).toBe(19.9);
  expect(balances.get('MTT')?.pendingTotal).toBe(0);
  expect(balances.get('BNB')?.unspentTotal).toBe(0.2);
  expect(balances.get('BNB')?.pendingTotal).toBe(0);
});

test('test syncedBlock large than targetBlock', async () => {
  const chain = await chainHandler.findOne(97);
  if (chain != null) {
    await chain.atomicUpdate((chainData) => {
      chainData.syncedBlockNumber = bscCurrentBlock;
      return chainData;
    });
    const contracts: ContractType[] = (await contractHandler.find({ selector: { chainId: 97 } })).map((c) => {
      const contractData = c.toMutableJSON();
      contractData.syncedBlockNumber = bscCurrentBlock;
      return contractData;
    });
    await context.db.contracts.bulkUpsert(contracts);
    const packerClient = new TestPackerClient(97, 18759679, bscCurrentBlock);
    const executor = new PackerExecutorV2(context, packerClient);
    const { syncedBlock, commitments } = await executor.import({ walletPassword, chainId: 97 });
    expect(syncedBlock).toBe(bscCurrentBlock);
    expect(commitments.length).toBe(0);
  } else {
    throw new Error('chain should not be null');
  }
});

test('test startBlock not equal to syncedBlock + 1', async () => {
  const packerClient = new TestPackerClient(97, 18739600, bscCurrentBlock - 8000);
  const executor = new PackerExecutorV2(context, packerClient);
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('invalid startBlock expected 18759679 vs actual 18739600'),
  );
});

test('test packer returns undefined', async () => {
  const packerClient = {
    fetch: () => Promise.resolve(undefined),
    savedBlock: () => Promise.resolve(bscCurrentBlock),
  };
  const executor = new PackerExecutorV2(context, packerClient);
  const { syncedBlock, commitments } = await executor.import({ walletPassword, chainId: 97 });
  expect(syncedBlock).toBe(18759678);
  expect(commitments.length).toBe(0);
});

test('test chain not found', async () => {
  const packerClient = new TestPackerClient(97, 18759679, bscCurrentBlock - 8000);
  const executor = new PackerExecutorV2(context, packerClient);
  await expect(executor.import({ walletPassword, chainId: 1000 })).rejects.toThrow(
    new Error('ChainConfig not found for chainId 1000'),
  );
  await context.db.chains.clear();
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Chain not found for chainId 97'),
  );
});

test('test chain syncedBlockNumber not correct with contracts', async () => {
  const chain = await chainHandler.findOne(97);
  if (chain != null) {
    await chain.atomicUpdate((chainData) => {
      chainData.syncedBlockNumber = bscCurrentBlock - 8000;
      return chainData;
    });
    const packerClient = new TestPackerClient(97, 18759679, bscCurrentBlock - 8000);
    const executor = new PackerExecutorV2(context, packerClient);
    await executor.import({ walletPassword, chainId: 97 });
    expect((await commitmentHandler.find({ selector: { chainId: 97 } })).length).toBe(63);
  } else {
    throw new Error('chain should not be null');
  }
});

test('test packer return corrupted commitment queued data', async () => {
  const corruptedCommitment = new data.v1.Commitment({
    blockNumber: BigInt(18917631),
    status: data.v1.CommitmentStatus.QUEUED,
    commitmentHash: toBN(
      '6975328448290487895254540323118937500580067046384965283223887560884963225839',
    ).toBuffer('le'),
  });
  const packerClient = {
    fetch: () =>
      Promise.resolve(
        new data.v1.ChainData({
          startBlock: BigInt(18759679),
          endBlock: BigInt(bscCurrentBlock - 8000),
          contractData: [
            new data.v1.ContractData({
              contractAddress: toBuff('0xae5009F4B58E6eF25Fee71174A827042c543ac46'),
              commitments: [corruptedCommitment],
              nullifiers: [],
            }),
          ],
        }),
      ),
    savedBlock: () => Promise.resolve(bscCurrentBlock),
  };
  const executor = new PackerExecutorV2(context, packerClient);
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Invalid commitment queued data'),
  );
  corruptedCommitment.leafIndex = BigInt(0);
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Invalid commitment queued data'),
  );
  corruptedCommitment.rollupFee = toBN('0').toBuffer('le');
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Invalid commitment queued data'),
  );
  corruptedCommitment.encryptedNote = toBuff('0xdeadbeef');
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Invalid commitment queued data'),
  );
  corruptedCommitment.queuedTransactionHash = toBuff(
    '0x6cb641ebb080c96f158c906deba38061f2992ecde51cd4527fff599cc93c5dd7',
  );
  corruptedCommitment.status = data.v1.CommitmentStatus.INCLUDED;
  await expect(executor.import({ walletPassword, chainId: 97 })).rejects.toThrow(
    new Error('Invalid commitment included data'),
  );
});

afterAll(async () => {
  await context.db.remove();
});
