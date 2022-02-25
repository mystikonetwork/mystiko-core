import { MystikoConfig, BridgeType } from '@mystiko/config';
import { check, toHexNoPrefix, toString, toBN, logger as rootLogger } from '@mystiko/utils';
import { ContractHandler } from '../handler/contractHandler.js';
import { WalletHandler } from '../handler/walletHandler.js';
import { NoteHandler } from '../handler/noteHandler.js';
import { DepositHandler } from '../handler/depositHandler.js';
import { WithdrawHandler } from '../handler/withdrawHandler.js';
import { EventHandler } from '../handler/eventHandler.js';
import { ContractPool } from '../chain/contract.js';
import { DepositStatus, PrivateNoteStatus, WithdrawStatus } from '../model';

const TopicType = {
  DEPOSIT: 'Deposit',
  MERKLE_TREE_INSERT: 'MerkleTreeInsert',
  WITHDRAW: 'Withdraw',
};
Object.freeze(TopicType);

/**
 * @class EventPuller
 * @desc a puller class which implements the logic of regularly pulling event data from on-chain source.
 * @param {Object} options options of this puller.
 * @param {MystikoConfig} options.config current effective config.
 * @param {ContractHandler} options.contractHandler handler instance for operating {@link Contract} instances.
 * @param {WalletHandler} options.walletHandler handler instance for operating {@link Wallet} instances.
 * @param {NoteHandler} options.noteHandler handler instance for operating {@link PrivateNote} instances.
 * @param {DepositHandler} options.depositHandler handler instance for operating {@link Deposit} instances.
 * @param {WithdrawHandler} options.withdrawHandler handler instance for operating {@link Withdraw} instances.
 * @param {ContractPool} options.contractPool pool of initialized and connected {@link external:Contract} instances.
 * @param {boolean} [options.isStoreEvent=false] whether to store the pulled {@link Event} into database.
 * @param {EventHandler} [options.eventHandler] handler instance for operating {@link Event} instances.
 * @param {number} [options.pullIntervalMs=60000] the time interval in milliseconds how often this puller pulls data.
 */
export class EventPuller {
  constructor({
    config,
    contractHandler,
    walletHandler,
    noteHandler,
    depositHandler,
    withdrawHandler,
    contractPool,
    isStoreEvent = false,
    eventHandler = undefined,
    pullIntervalMs = 60000,
  }) {
    check(config instanceof MystikoConfig, 'config should be an instance of MystikoConfig');
    check(
      contractHandler instanceof ContractHandler,
      'contractHandler should be an instance ContractHandler',
    );
    check(walletHandler instanceof WalletHandler, 'walletHandler should be an instance of WalletHandler');
    check(noteHandler instanceof NoteHandler, 'noteHandler should be an instance of NoteHandler');
    check(depositHandler instanceof DepositHandler, 'depositHandler should be an instance of DepositHandler');
    check(
      withdrawHandler instanceof WithdrawHandler,
      'withdrawHandler should be an instance of WithdrawHandler',
    );
    check(contractPool instanceof ContractPool, 'providerPool should be an instance of ProviderPool');
    check(typeof isStoreEvent === 'boolean', 'isStoreEvent should be a boolean type');
    check(
      !isStoreEvent || eventHandler instanceof EventHandler,
      'eventHandler should be an instance of EventHandler',
    );
    check(typeof pullIntervalMs === 'number', 'pullIntervalMs should be a number type');
    this.config = config;
    this.contractHandler = contractHandler;
    this.walletHandler = walletHandler;
    this.noteHandler = noteHandler;
    this.depositHandler = depositHandler;
    this.withdrawHandler = withdrawHandler;
    this.contractPool = contractPool;
    this.isStoreEvent = isStoreEvent;
    this.eventHandler = eventHandler;
    this.pullIntervalMs = pullIntervalMs;
    this.topics = Object.values(TopicType);
    this.hasPendingPull = false;
    this.errorMessage = undefined;
    this.logger = rootLogger.getLogger('EventPuller');
  }

  /**
   * @desc start this puller immediately with the given time interval.
   * @returns {Promise<void>}
   */
  start() {
    const promise = this._pullAllContractEvents();
    this.timer = setInterval(async () => {
      await this._pullAllContractEvents();
    }, this.pullIntervalMs);
    return promise;
  }

  /**
   * @desc whether this puller has been started.
   * @returns {boolean} true if it is running, otherwise it returns false.
   */
  isStarted() {
    return !!this.timer;
  }

  /**
   * @desc stop this running puller if necessary. This is for graceful shutdown.
   */
  stop() {
    if (this.timer) {
      this.logger.debug('stopping event puller...');
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  _pullAllContractEvents() {
    if (!this.hasPendingPull) {
      if (!this.walletHandler.getCurrentWallet()) {
        this.logger.info('no existing wallet has been created, skipping pulling...');
        return;
      }
      this.logger.debug('start event pulling...');
      this.hasPendingPull = true;
      const promises = [];
      this.contractHandler
        .getContracts({ filterFunc: (contract) => contract.version > 0 })
        .forEach((contract) => {
          promises.push(this._pullContractEvents(contract));
        });
      return Promise.all(promises)
        .then(() => {
          this.logger.debug(`one event pulling is done, resume in ${this.pullIntervalMs / 1000} seconds`);
          this.hasPendingPull = false;
          this.errorMessage = undefined;
        })
        .catch((error) => {
          console.log('error', error);
          this.logger.warn(`something wrong during pulling contract events: ${toString(error)}`);
          this.hasPendingPull = false;
          this.errorMessage = error;
        });
    } else {
      this.logger.warn('there is one pulling which is still running, skipping this one');
    }
  }

  async _pullContractEvents(contract) {
    const connectedContract = this.contractPool.getContract(contract.chainId, contract.address);
    check(connectedContract, 'connectedContract should not be undefined or null');
    const currentBlockNumber = await connectedContract.provider.getBlockNumber();
    const allPromises = [];
    for (let i = 0; i < this.topics.length; i++) {
      const topic = this.topics[i];
      const fromBlock = contract.syncedBlock ? contract.syncedBlock : 0;
      const promise = connectedContract.queryFilter(topic, fromBlock, currentBlockNumber).then((events) => {
        return this._handleEvents(contract, topic, events);
      });
      allPromises.push(promise);
    }
    return Promise.all(allPromises).then(() => {
      return this.contractHandler.updateSyncedBlock(
        contract.chainId,
        contract.address,
        currentBlockNumber + 1,
      );
    });
  }

  async _handleEvents(contract, topic, events) {
    const rawEvents = events.map((event) => {
      const rawData = {};
      rawData.chainId = contract.chainId;
      rawData.contractAddress = contract.address;
      rawData.topic = topic;
      rawData.transactionHash = event.transactionHash;
      if (topic === TopicType.DEPOSIT) {
        rawData.argumentData = {
          amount: event.args['amount'].toString(),
          commitmentHash: event.args['commitmentHash'],
          encryptedNote: event.args['encryptedNote'],
        };
      } else if (topic === TopicType.MERKLE_TREE_INSERT) {
        rawData.argumentData = {
          leaf: event.args['leaf'],
          leafIndex: event.args['leafIndex'],
          amount: toString(event.args['amount']),
        };
      } else if (topic === TopicType.WITHDRAW) {
        rawData.argumentData = {
          recipient: event.args['recipient'],
          rootHash: toString(event.args['rootHash']),
          serialNumber: toString(event.args['serialNumber']),
        };
      }
      return rawData;
    });
    let eventsPromise;
    if (this.isStoreEvent) {
      eventsPromise = this.eventHandler.addEvents(rawEvents);
    } else {
      eventsPromise = Promise.resolve([]);
    }
    const promises = [eventsPromise];
    if (topic === TopicType.DEPOSIT) {
      promises.push(this._handleDepositEvents(contract, rawEvents));
    } else if (topic === TopicType.MERKLE_TREE_INSERT) {
      promises.push(this._handleMerkleTreeInsertEvents(contract, rawEvents));
    } else if (topic === TopicType.WITHDRAW) {
      promises.push(this._handleWithdrawEvents(contract, rawEvents));
    }
    await Promise.all(promises);
  }

  _handleDepositEvents(contract, rawEvents) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const rawEvent = rawEvents[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.commitmentHash), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.srcChainId === rawEvent.chainId &&
          deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j++) {
        const deposit = deposits[j];
        if (contract.bridgeType === BridgeType.LOOP && deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          promises.push(this.depositHandler._updateDeposit(deposit));
        } else if (
          contract.bridgeType !== BridgeType.LOOP &&
          deposit.status !== DepositStatus.SRC_CONFIRMED &&
          deposit.status !== DepositStatus.SUCCEEDED
        ) {
          deposit.status = DepositStatus.SRC_CONFIRMED;
          promises.push(this.depositHandler._updateDeposit(deposit));
        }
      }
    }
    return Promise.all(promises);
  }

  _handleMerkleTreeInsertEvents(contract, rawEvents) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const rawEvent = rawEvents[i];
      const commitmentHash = toBN(toHexNoPrefix(rawEvent.argumentData.leaf), 16).toString();
      const deposits = this.depositHandler.getDeposits({
        filterFunc: (deposit) =>
          deposit.dstChainId === rawEvent.chainId &&
          deposit.commitmentHash &&
          deposit.commitmentHash.toString() === commitmentHash,
      });
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) =>
          note.dstChainId === rawEvent.chainId &&
          note.commitmentHash &&
          note.commitmentHash.toString() === commitmentHash,
      });
      for (let j = 0; j < deposits.length; j++) {
        const deposit = deposits[j];
        if (deposit.status !== DepositStatus.SUCCEEDED) {
          deposit.status = DepositStatus.SUCCEEDED;
          deposit.dstTxHash = rawEvent.transactionHash;
          promises.push(this.depositHandler._updateDeposit(deposit));
        }
      }
      for (let j = 0; j < notes.length; j++) {
        const note = notes[j];
        note.dstTransactionHash = rawEvent.transactionHash;
        promises.push(this.noteHandler._updatePrivateNote(note));
      }
    }
    return Promise.all(promises);
  }

  _handleWithdrawEvents(contract, rawEvents) {
    const promises = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const rawEvent = rawEvents[i];
      const rootHash = rawEvent.argumentData.rootHash.toString();
      const serialNumber = rawEvent.argumentData.serialNumber.toString();
      const withdraws = this.withdrawHandler.getWithdraws({
        filterFunc: (withdraw) => {
          return (
            withdraw.merkleRootHash &&
            withdraw.merkleRootHash.toString() === rootHash &&
            withdraw.serialNumber &&
            withdraw.serialNumber.toString() === serialNumber &&
            withdraw.chainId === rawEvent.chainId
          );
        },
      });
      const withdrewNoteIds = withdraws.map((withdraw) => withdraw.privateNoteId);
      const notes = this.noteHandler.getPrivateNotes({
        filterFunc: (note) => withdrewNoteIds.indexOf(note.id) !== -1,
      });
      for (let j = 0; j < withdraws.length; j++) {
        const withdraw = withdraws[j];
        if (withdraw.status !== WithdrawStatus.SUCCEEDED) {
          withdraw.status = WithdrawStatus.SUCCEEDED;
          withdraw.transactionHash = rawEvent.transactionHash;
          promises.push(this.withdrawHandler._updateWithdraw(withdraw));
        }
      }
      for (let j = 0; j < notes.length; j++) {
        const note = notes[j];
        if (note.status !== PrivateNoteStatus.SPENT) {
          note.status = PrivateNoteStatus.SPENT;
          promises.push(this.noteHandler._updatePrivateNote(note));
        }
      }
    }
    return Promise.all(promises);
  }
}
