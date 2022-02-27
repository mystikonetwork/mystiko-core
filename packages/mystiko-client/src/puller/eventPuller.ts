import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { MystikoConfig, BridgeType } from '@mystiko/config';
import { toHexNoPrefix, toString, toBN, logger as rootLogger } from '@mystiko/utils';
import {
  ContractHandler,
  WalletHandler,
  NoteHandler,
  DepositHandler,
  WithdrawHandler,
  EventHandler,
} from '../handler';
import { ContractPool } from '../chain';
import { Contract, Event, DepositStatus, PrivateNoteStatus, RawEvent, WithdrawStatus } from '../model';

enum TopicType {
  DEPOSIT = 'Deposit',
  MERKLE_TREE_INSERT = 'MerkleTreeInsert',
  WITHDRAW = 'Withdraw',
}

interface EventPullerParams {
  config: MystikoConfig;
  contractHandler: ContractHandler;
  walletHandler: WalletHandler;
  noteHandler: NoteHandler;
  depositHandler: DepositHandler;
  withdrawHandler: WithdrawHandler;
  contractPool: ContractPool;
  isStoreEvent?: boolean;
  eventHandler?: EventHandler;
  pullIntervalMs?: number;
}

/**
 * @class EventPuller
 * @desc a puller class which implements the logic of regularly pulling event data from on-chain source.
 * @param {EventPullerParams} options options of this puller.
 * @param {MystikoConfig} options.config current effective config.
 * @param {ContractHandler} options.contractHandler handler instance for operating {@link Contract} instances.
 * @param {WalletHandler} options.walletHandler handler instance for operating {@link Wallet} instances.
 * @param {NoteHandler} options.noteHandler handler instance for operating {@link PrivateNote} instances.
 * @param {DepositHandler} options.depositHandler handler instance for operating {@link Deposit} instances.
 * @param {WithdrawHandler} options.withdrawHandler handler instance for operating {@link Withdraw} instances.
 * @param {ContractPool} options.contractPool pool of initialized and connected ethers.Contract instances.
 * @param {boolean} [options.isStoreEvent=false] whether to store the pulled {@link Event} into database.
 * @param {EventHandler} [options.eventHandler] handler instance for operating {@link Event} instances.
 * @param {number} [options.pullIntervalMs=60000] the time interval in milliseconds how often this puller pulls data.
 */
export class EventPuller {
  private readonly config: MystikoConfig;

  private readonly contractHandler: ContractHandler;

  private readonly walletHandler: WalletHandler;

  private readonly noteHandler: NoteHandler;

  private readonly depositHandler: DepositHandler;

  private readonly withdrawHandler: WithdrawHandler;

  private readonly contractPool: ContractPool;

  private readonly isStoreEvent: boolean;

  private readonly eventHandler?: EventHandler;

  private readonly pullIntervalMs: number;

  private readonly topics: string[];

  private hasPendingPull: boolean;

  private errorMessage?: string;

  private timer?: any;

  private readonly logger: Logger;

  constructor(options: EventPullerParams) {
    const {
      config,
      contractHandler,
      walletHandler,
      noteHandler,
      depositHandler,
      withdrawHandler,
      contractPool,
      isStoreEvent,
      eventHandler,
      pullIntervalMs,
    } = options;
    this.config = config;
    this.contractHandler = contractHandler;
    this.walletHandler = walletHandler;
    this.noteHandler = noteHandler;
    this.depositHandler = depositHandler;
    this.withdrawHandler = withdrawHandler;
    this.contractPool = contractPool;
    this.isStoreEvent = isStoreEvent || false;
    this.eventHandler = eventHandler;
    this.pullIntervalMs = pullIntervalMs || 60000;
    this.topics = Object.values(TopicType);
    this.hasPendingPull = false;
    this.errorMessage = undefined;
    this.logger = rootLogger.getLogger('EventPuller');
  }

  /**
   * @desc start this puller immediately with the given time interval.
   * @returns {Promise<any>}
   */
  public start(): Promise<any> {
    const promise = this.pullAllContractEvents();
    this.timer = setInterval(async () => {
      await this.pullAllContractEvents();
    }, this.pullIntervalMs);
    return promise;
  }

  /**
   * @desc whether this puller has been started.
   * @returns {boolean} true if it is running, otherwise it returns false.
   */
  public isStarted(): boolean {
    return !!this.timer;
  }

  /**
   * @desc stop this running puller if necessary. This is for graceful shutdown.
   */
  public stop() {
    if (this.timer) {
      this.logger.debug('stopping event puller...');
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  public isPending(): boolean {
    return this.hasPendingPull;
  }

  public getError(): string | undefined {
    return this.errorMessage;
  }

  private pullAllContractEvents(): Promise<any> {
    if (!this.hasPendingPull) {
      if (!this.walletHandler.getCurrentWallet()) {
        this.logger.info('no existing wallet has been created, skipping pulling...');
        return Promise.resolve(undefined);
      }
      this.logger.debug('start event pulling...');
      this.hasPendingPull = true;
      const promises: Promise<any>[] = [];
      this.contractHandler
        .getContracts({ filterFunc: (contract) => contract.version > 0 })
        .forEach((contract) => {
          promises.push(this.pullContractEvents(contract));
        });
      return Promise.all(promises)
        .then(() => {
          this.logger.debug(`one event pulling is done, resume in ${this.pullIntervalMs / 1000} seconds`);
          this.hasPendingPull = false;
          this.errorMessage = undefined;
        })
        .catch((error) => {
          this.logger.warn(`something wrong during pulling contract events: ${toString(error)}`);
          this.hasPendingPull = false;
          this.errorMessage = error;
        });
    }
    this.logger.warn('there is one pulling which is still running, skipping this one');
    return Promise.resolve(undefined);
  }

  private async pullContractEvents(contract: Contract) {
    if (contract.chainId && contract.address) {
      const { chainId, address } = contract;
      const connectedContract = this.contractPool.getContract(chainId, address);
      if (connectedContract) {
        const currentBlockNumber = await connectedContract.provider.getBlockNumber();
        const fromBlock = contract.syncedBlock ? contract.syncedBlock : 0;
        const depositPromise = connectedContract.queryFilter(
          connectedContract.filters.Deposit(),
          fromBlock,
          currentBlockNumber,
        );
        const merkleTreePromise = connectedContract.queryFilter(
          connectedContract.filters.MerkleTreeInsert(),
          fromBlock,
          currentBlockNumber,
        );
        const withdrawPromise = connectedContract.queryFilter(
          connectedContract.filters.Withdraw(),
          fromBlock,
          currentBlockNumber,
        );
        Promise.all([depositPromise, merkleTreePromise, withdrawPromise])
          .then((events: ethers.Event[][]) => this.handleEvents(contract, events.flat()))
          .then(() => this.contractHandler.updateSyncedBlock(chainId, address, currentBlockNumber + 1));
      }
    }
  }

  private async handleEvents(contract: Contract, events: ethers.Event[]) {
    const depositEvents: RawEvent[] = [];
    const merkleTreeEvents: RawEvent[] = [];
    const withdrawEvents: RawEvent[] = [];
    const rawEvents = events.map((event) => {
      const rawData: RawEvent = {};
      rawData.chainId = contract.chainId;
      rawData.contractAddress = contract.address;
      rawData.topic = event.event;
      rawData.transactionHash = event.transactionHash;
      if (event.args) {
        if (event.event === TopicType.DEPOSIT) {
          rawData.argumentData = {
            amount: event.args.amount?.toString(),
            commitmentHash: event.args.commitmentHash,
            encryptedNote: event.args.encryptedNote,
          };
          depositEvents.push(rawData);
        } else if (event.event === TopicType.MERKLE_TREE_INSERT) {
          rawData.argumentData = {
            leaf: event.args.leaf,
            leafIndex: event.args.leafIndex,
            amount: toString(event.args.amount),
          };
          merkleTreeEvents.push(rawData);
        } else if (event.event === TopicType.WITHDRAW) {
          rawData.argumentData = {
            recipient: event.args.recipient,
            rootHash: toString(event.args.rootHash),
            serialNumber: toString(event.args.serialNumber),
          };
          withdrawEvents.push(rawData);
        }
      }
      return rawData;
    });
    let eventsPromise: Promise<Event[]>;
    if (this.eventHandler && this.isStoreEvent) {
      eventsPromise = this.eventHandler.addEvents(rawEvents);
    } else {
      eventsPromise = Promise.resolve([]);
    }
    const promises: Promise<any>[] = [eventsPromise];
    promises.push(this.handleDepositEvents(contract, depositEvents));
    promises.push(this.handleMerkleTreeInsertEvents(merkleTreeEvents));
    promises.push(this.handleWithdrawEvents(withdrawEvents));
    await Promise.all(promises);
  }

  private handleDepositEvents(contract: Contract, rawEvents: RawEvent[]) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i += 1) {
      const rawEvent = rawEvents[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.commitmentHash), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.srcChainId === rawEvent.chainId &&
          !!deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j += 1) {
        const deposit = deposits[j];
        if (contract.bridgeType === BridgeType.LOOP && deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          promises.push(this.depositHandler.updateDeposit(deposit));
        } else if (
          contract.bridgeType !== BridgeType.LOOP &&
          deposit.status !== DepositStatus.SRC_CONFIRMED &&
          deposit.status !== DepositStatus.SUCCEEDED
        ) {
          deposit.status = DepositStatus.SRC_CONFIRMED;
          promises.push(this.depositHandler.updateDeposit(deposit));
        }
      }
    }
    return Promise.all(promises);
  }

  private handleMerkleTreeInsertEvents(rawEvents: RawEvent[]) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i += 1) {
      const rawEvent = rawEvents[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.leaf), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.dstChainId === rawEvent.chainId &&
          !!deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) =>
          note.dstChainId === rawEvent.chainId &&
          !!note.commitmentHash &&
          note.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j += 1) {
        const deposit = deposits[j];
        if (deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          deposit.dstTxHash = rawEvent.transactionHash;
          promises.push(this.depositHandler.updateDeposit(deposit));
        }
      }
      for (let j = 0; j < notes.length; j += 1) {
        const note = notes[j];
        note.dstTransactionHash = rawEvent.transactionHash;
        promises.push(this.noteHandler.updatePrivateNote(note));
      }
    }
    return Promise.all(promises);
  }

  private handleWithdrawEvents(rawEvents: RawEvent[]) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i += 1) {
      const rawEvent = rawEvents[i];
      const rootHash = rawEvent.argumentData.rootHash.toString();
      const serialNumber = rawEvent.argumentData.serialNumber.toString();
      const withdraws = this.withdrawHandler.getWithdraws({
        filterFunc: (withdraw) =>
          !!withdraw.merkleRootHash &&
          withdraw.merkleRootHash.toString() === rootHash &&
          !!withdraw.serialNumber &&
          withdraw.serialNumber.toString() === serialNumber &&
          withdraw.chainId === rawEvent.chainId,
      });
      const withdrewNoteIds = withdraws.map((withdraw) => withdraw.privateNoteId);
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) => withdrewNoteIds.indexOf(note.id) !== -1,
      });
      for (let j = 0; j < withdraws.length; j += 1) {
        const withdraw = withdraws[j];
        if (withdraw.status !== WithdrawStatus.SUCCEEDED) {
          withdraw.status = WithdrawStatus.SUCCEEDED;
          withdraw.transactionHash = rawEvent.transactionHash;
          promises.push(this.withdrawHandler.updateWithdraw(withdraw));
        }
      }
      for (let j = 0; j < notes.length; j += 1) {
        const note = notes[j];
        if (note.status !== PrivateNoteStatus.SPENT) {
          note.status = PrivateNoteStatus.SPENT;
          promises.push(this.noteHandler.updatePrivateNote(note));
        }
      }
    }
    return Promise.all(promises);
  }
}
