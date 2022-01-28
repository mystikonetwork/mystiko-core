import BN from 'bn.js';
import { MystikoConfig } from '../config';
import { ContractHandler } from '../handler/contractHandler.js';
import { DepositHandler } from '../handler/depositHandler.js';
import { EventHandler } from '../handler/eventHandler.js';
import { ContractPool } from '../chain/contract.js';
import { check, toHexNoPrefix, toString } from '../utils.js';
import { DepositStatus } from '../model';
import rootLogger from '../logger';

const TopicType = {
  DEPOSIT: 'Deposit',
  MERKLE_TREE_INSERT: 'MerkleTreeInsert',
  WITHDRAW: 'Withdraw',
};
Object.freeze(TopicType);

/**
 * @class EventPuller
 */
export class EventPuller {
  constructor({
    config,
    contractHandler,
    depositHandler,
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
    check(depositHandler instanceof DepositHandler, 'depositHandler should be an instance of DepositHandler');
    check(contractPool instanceof ContractPool, 'providerPool should be an instance of ProviderPool');
    check(typeof isStoreEvent === 'boolean', 'isStoreEvent should be a boolean type');
    check(
      !isStoreEvent || eventHandler instanceof EventHandler,
      'eventHandler should be an instance of EventHandler',
    );
    check(typeof pullIntervalMs === 'number', 'pullIntervalMs should be a number type');
    this.config = config;
    this.contractHandler = contractHandler;
    this.depositHandler = depositHandler;
    this.contractPool = contractPool;
    this.isStoreEvent = isStoreEvent;
    this.eventHandler = eventHandler;
    this.pullIntervalMs = pullIntervalMs;
    this.topics = Object.values(TopicType);
    this.hasPendingPull = false;
    this.logger = rootLogger.getLogger('EventPuller');
  }

  start() {
    this._pullAllContractEvents();
    this.timer = setInterval(async () => {
      await this._pullAllContractEvents();
    }, this.pullIntervalMs);
  }

  isStarted() {
    return !!this.timer;
  }

  stop() {
    if (this.timer) {
      this.logger.debug('stopping event puller...');
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async _pullAllContractEvents() {
    if (!this.hasPendingPull) {
      this.logger.debug('start event pulling...');
      this.hasPendingPull = true;
      const promises = [];
      this.config.chains.forEach((chainConfig) => {
        chainConfig.contracts.forEach((contractConfig) => {
          const contract = this.contractHandler.getContract(chainConfig.chainId, contractConfig.address);
          if (contract) {
            promises.push(this._pullContractEvents(contract));
          }
        });
      });
      await Promise.all(promises)
        .then(() => {
          this.logger.debug(`one event pulling is done, resume in ${this.pullIntervalMs / 1000} seconds`);
          this.hasPendingPull = false;
        })
        .catch((error) => {
          this.logger.warn(`something wrong during pulling contract events: ${toString(error)}`);
          this.hasPendingPull = false;
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
    await Promise.all(allPromises).then(() => {
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
      if (topic === TopicType.DEPOSIT && event.args.length > 0) {
        rawData.argumentData = {
          amount: event.args['amount'].toString(),
          commitmentHash: event.args['commitmentHash'],
          encryptedNote: event.args['encryptedNote'],
        };
      } else if (topic === TopicType.MERKLE_TREE_INSERT && event.args.length > 0) {
        rawData.argumentData = {
          leaf: event.args['leaf'],
          leafIndex: event.args['leafIndex'],
          amount: event.args['amount'].toString(),
        };
      } else if (topic === TopicType.WITHDRAW && event.args.length > 0) {
        rawData.argumentData = {
          recipient: event.args['recipient'],
          rootHash: event.args['rootHash'].toString(),
          serialNumber: event.args['serialNumber'].toString(),
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
    if (topic === TopicType.MERKLE_TREE_INSERT) {
      for (let i = 0; i < rawEvents.length; i++) {
        const rawEvent = rawEvents[i];
        const commitmentHash = new BN(toHexNoPrefix(rawEvent.argumentData.leaf), 16).toString();
        const deposits = this.depositHandler.getDeposits({
          filterFunc: (deposit) =>
            deposit.dstChainId === rawEvent.chainId && deposit.commitmentHash.toString() === commitmentHash,
        });
        for (let j = 0; j < deposits.length; j++) {
          if (deposits[j].status !== DepositStatus.SUCCEEDED) {
            this.logger.info(
              `updating deposit(id=${deposits[j].id}) from ${rawEvent.chainId} status to ${DepositStatus.SUCCEEDED}`,
            );
            promises.push(this.depositHandler._updateDepositStatus(deposits[j], DepositStatus.SUCCEEDED));
          }
        }
      }
    }
    await Promise.all(promises);
  }
}
