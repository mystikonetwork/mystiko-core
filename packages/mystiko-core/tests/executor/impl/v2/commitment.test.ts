// eslint-disable-next-line max-classes-per-file
import { BridgeType, ContractType, MystikoConfig } from '@mystikonetwork/config';
import {
  CommitmentPool__factory,
  SupportedContractType,
  TypedEvent,
  TypedEventFilter,
} from '@mystikonetwork/contracts-abi';
import { CommitmentStatus, DepositStatus } from '@mystikonetwork/database';
import { ProviderPoolImpl } from '@mystikonetwork/ethers';
import { readJsonFile } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  AccountHandlerV2,
  AssetHandlerV2,
  ChainHandlerV2,
  CommitmentExecutorV2,
  CommitmentHandlerV2,
  ContractHandlerV2,
  DepositHandlerV2,
  MystikoContext,
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
let depositHandler: DepositHandlerV2;
let assetHandler: AssetHandlerV2;
let executor: CommitmentExecutorV2;

const ropstenCurrentBlock = 12225901;
const bscCurrentBlock = 18855003;

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
    if (this.chainId === 3) {
      return Promise.resolve(ropstenCurrentBlock);
    }
    return Promise.resolve(bscCurrentBlock);
  }
}

class TestContract extends ethers.Contract {
  async queryFilter<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>,
    fromBlock?: number,
    toBlock?: number,
  ): Promise<Array<TEvent>> {
    const chainId = await this.provider.getNetwork().then((n) => n.chainId);
    const allEvents = testEvents[chainId][this.address][JSON.stringify(eventFilter.topics)];
    const filteredEvents = allEvents.filter((event) => {
      let valid = true;
      if (fromBlock) {
        valid = event.blockNumber >= fromBlock;
      }
      if (toBlock) {
        valid = valid && event.blockNumber <= toBlock;
      }
      return valid;
    });
    const contractInterface = this.interface;
    const { topics } = eventFilter;
    if (!topics) {
      throw new Error('topics should not be undefined');
    }
    const topic = topics[0];
    let fragment: ethers.utils.EventFragment;
    if (typeof topic === 'string') {
      fragment = contractInterface.getEvent(topic);
    } else {
      fragment = contractInterface.getEvent(topic[0]);
    }
    return Promise.resolve(
      filteredEvents.map((e) => {
        e.args = contractInterface.decodeEventLog(fragment, e.data, e.topics);
        return e as TEvent;
      }),
    );
  }
}

class TestProviderPool extends ProviderPoolImpl {
  public getProvider(chainId: number): Promise<ethers.providers.Provider | undefined> {
    return Promise.resolve(new TestProvider('http://localhost:8545', chainId));
  }
}

beforeEach(async () => {
  testEvents = await loadEvents('tests/files/events.test.json');
  config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  context = await createTestContext({
    config,
    providerPool: new TestProviderPool(config),
    contractConnector: {
      connect<T extends SupportedContractType>(
        contractName: string,
        address: string,
        signerOrProvider: ethers.Signer | ethers.providers.Provider,
      ): T {
        return new TestContract(address, CommitmentPool__factory.abi, signerOrProvider) as T;
      },
    },
  });
  walletHandler = new WalletHandlerV2(context);
  accountHandler = new AccountHandlerV2(context);
  chainHandler = new ChainHandlerV2(context);
  contractHandler = new ContractHandlerV2(context);
  commitmentHandler = new CommitmentHandlerV2(context);
  depositHandler = new DepositHandlerV2(context);
  assetHandler = new AssetHandlerV2(context);
  executor = new CommitmentExecutorV2(context);
  const databaseData = await readJsonFile('tests/files/database.unsync.test.json');
  await context.db.importJSON(databaseData);
  expect(context.wallets).toBe(walletHandler);
  expect(context.accounts).toBe(accountHandler);
});

afterEach(async () => {
  await context.db.remove();
});

test('test import all events', async () => {
  await executor.import({ walletPassword });
  expect((await commitmentHandler.find()).length).toBe(56);
  expect((await chainHandler.findOne(3))?.syncedBlockNumber).toBe(ropstenCurrentBlock);
  expect((await chainHandler.findOne(97))?.syncedBlockNumber).toBe(bscCurrentBlock);
  const contracts = await contractHandler.find();
  for (let i = 0; i < contracts.length; i += 1) {
    const contract = contracts[i];
    if (contract.type === ContractType.POOL) {
      expect(contract.syncedBlockNumber).toBe(contract.chainId === 3 ? ropstenCurrentBlock : bscCurrentBlock);
    }
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
          expect(deposit.transactionHash).toBe(commitment.creationTransactionHash);
          if (deposit.bridgeType !== BridgeType.LOOP) {
            expect(deposit.relayTransactionHash).toBe(commitment.relayTransactionHash);
          }
        }),
    );
  }
  await Promise.all(commitmentPromises);
  let commitment = await commitmentHandler.findOne('eded38f5-d3c9-49f5-878c-9d9232a74978');
  expect(commitment?.status).toBe(CommitmentStatus.SPENT);
  expect(commitment?.spendingTransactionHash).toBe(
    '0xe6168647f8beb195d4d6512154b5c328b37493cc87abb2b206dbef5d8fb67697',
  );
  commitment = await commitmentHandler.findOne('cafbcaa4-2bd9-4ae0-9673-a9707c92bd2a');
  expect(commitment?.status).toBe(CommitmentStatus.INCLUDED);
  commitment = await commitmentHandler.findOne('11e41c38-dcd6-4986-84db-ac68078a3c1b');
  expect(commitment?.status).toBe(CommitmentStatus.INCLUDED);
  commitment = await commitmentHandler.findOne({
    chainId: 97,
    contractAddress: '0x3c500d9660b98D65b5577bB3b9ECB389d6386BFA',
    commitmentHash: '17895733351896543519145553018111611932696899939062704937376219400860817450770',
  });
  expect(commitment?.amount).toBe('10000000000000000000');
  expect(commitment?.leafIndex).toBe('5');
  expect(commitment?.serialNumber).not.toBe(undefined);
  expect(commitment?.encryptedNote).not.toBe(undefined);
  const balances = await assetHandler.balances();
  expect(balances.get('MTT')?.unspentTotal).toBe(30);
  expect(balances.get('MTT')?.pendingTotal).toBe(0);
  expect(balances.get('BNB')?.unspentTotal).toBe(0.1);
  expect(balances.get('BNB')?.pendingTotal).toBe(0);
});

test('import commitments of one chain', async () => {
  await executor.import({ walletPassword, chainId: 3 });
  expect((await commitmentHandler.find()).length).toBe(6);
});

test('import commitments of one contract', async () => {
  await executor.import({
    walletPassword,
    chainId: 97,
    contractAddress: '0x3c500d9660b98D65b5577bB3b9ECB389d6386BFA',
  });
  expect((await commitmentHandler.find()).length).toBe(9);
});
