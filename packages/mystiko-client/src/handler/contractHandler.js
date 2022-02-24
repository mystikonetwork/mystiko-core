import { ethers } from 'ethers';
import { check } from '@mystiko/utils';

import { Handler } from './handler.js';
import { Contract } from '../model';
import rootLogger from '../logger.js';

/**
 * @class ContractHandler
 * @extends Handler
 * @param {module:mystiko/db.WrappedDb} db instance of {@link module:mystiko/db.WrappedDb}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for operating smart contract related resources.
 */
export class ContractHandler extends Handler {
  constructor(db, config) {
    super(db, config);
    this.logger = rootLogger.getLogger('ContractHandler');
  }

  /**
   * @desc import contract data from current effective configuration.
   * @returns {Promise<void>}
   */
  async importFromConfig() {
    this.config.chains.forEach((chainConfig) => {
      chainConfig.contracts.forEach((contractConfig) => {
        this._upsertContractConfig(chainConfig.chainId, contractConfig);
      });
    });
    await this.saveDatabase();
  }

  /**
   * @desc get contract by chainId and contract address.
   * @param {number} chainId chain id of this querying contract.
   * @param {string} address the deployed address of this querying contract.
   * @returns {Contract|undefined} a {@link Contract} object if it exists, otherwise it returns undefined.
   */
  getContract(chainId, address) {
    check(typeof chainId === 'number', 'chainId should be a number type');
    check(ethers.utils.isAddress(address), `address ${address} is invalid`);
    const contractData = this.db.contracts.findOne({ chainId, address });
    return contractData ? new Contract(contractData) : undefined;
  }

  /**
   * @desc get an array of {@link Contract} with the given filtering/sorting/pagination criteria.
   * @param {object} [options={}] an object contains the search criteria.
   * @param {Function} [options.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Contract}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [options.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [options.desc] whether the returned array should be sorted in descending order.
   * @param {number} [options.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [options.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Contract[]} an array of {@link Contract} which meets the search criteria.
   */
  getContracts({ filterFunc, sortBy, desc, offset, limit } = {}) {
    let queryChain = this.db.contracts.chain();
    if (filterFunc) {
      queryChain = queryChain.where(filterFunc);
    }
    if (sortBy && typeof sortBy === 'string') {
      queryChain = queryChain.simplesort(sortBy, desc ? desc : false);
    }
    if (offset && typeof offset === 'number') {
      queryChain = queryChain.offset(offset);
    }
    if (limit && typeof limit === 'number') {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Contract(rawObject));
  }

  /**
   * @desc update the synchronized block number to the given new number.
   * @param {number} chainId chain id of this querying contract.
   * @param {string} address the deployed address of this querying contract.
   * @param {number} syncedBlock the new number.
   * @returns {Promise<void>}
   */
  async updateSyncedBlock(chainId, address, syncedBlock) {
    check(typeof syncedBlock === 'number', 'syncedBlock should be a number type');
    const contract = this.getContract(chainId, address);
    if (contract) {
      contract.syncedBlock = syncedBlock;
      this.db.contracts.update(contract.data);
      await this.saveDatabase();
      this.logger.debug(
        `updated contract(id=${contract.id}, chainId=${contract.chainId}, ` +
          `address=${contract.address}) syncedBlock to ${syncedBlock}`,
      );
    }
  }

  _upsertContractConfig(chainId, contractConfig) {
    let contract = this.getContract(chainId, contractConfig.address);
    if (!contract) {
      contract = new Contract();
    }
    contract.version = contractConfig.version;
    contract.name = contractConfig.name;
    contract.chainId = chainId;
    contract.address = contractConfig.address;
    contract.bridgeType = contractConfig.bridgeType;
    contract.assetType = contractConfig.assetType;
    contract.assetAddress = contractConfig.assetAddress;
    contract.assetSymbol = contractConfig.assetSymbol;
    contract.assetDecimals = contractConfig.assetDecimals;
    contract.peerChainId = contractConfig.peerChainId;
    contract.peerContractAddress = contractConfig.peerContractAddress;
    contract.circuits = contractConfig.circuits;
    if (contract.id) {
      this.db.contracts.update(contract.data);
      this.logger.debug(
        `updated contract(id=${contract.id}, chainId=${contract.chainId}, ` +
          `address=${contract.address}) information in database`,
      );
    } else {
      this.db.contracts.insert(contract.data);
      this.logger.debug(
        `added contract(id=${contract.id}, chainId=${contract.chainId}, ` +
          `address=${contract.address}) information in database`,
      );
    }
  }
}
