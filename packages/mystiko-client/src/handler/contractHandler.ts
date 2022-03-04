import { ethers } from 'ethers';
import { ContractConfig, MystikoConfig } from '@mystiko/config';
import { check, logger as rootLogger } from '@mystiko/utils';

import { Handler } from './handler';
import { Contract } from '../model';
import { MystikoDatabase } from '../database';

interface QueryParam {
  filterFunc?: (item: Contract) => boolean;
  sortBy?: string;
  desc?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * @class ContractHandler
 * @extends Handler
 * @param {MystikoDatabase} db instance of {@link MystikoDatabase}.
 * @param {MystikoConfig} config instance of {@link MystikoConfig}.
 * @desc handler class for operating smart contract related resources.
 */
export class ContractHandler extends Handler {
  constructor(db: MystikoDatabase, config?: MystikoConfig) {
    super(db, config);
    this.logger = rootLogger.getLogger('ContractHandler');
  }

  /**
   * @desc import contract data from current effective configuration.
   * @returns {Promise<void>}
   */
  async importFromConfig(): Promise<void> {
    this.config.chains.forEach((chainConfig) => {
      chainConfig.contracts.forEach((contractConfig) => {
        this.upsertContractConfig(chainConfig.chainId, contractConfig);
      });
    });
    await this.saveDatabase();
  }

  /**
   * @desc get contract by chainId and contract address.
   * @param {number} chainId chain id of this querying contract.
   * @param {string} address the deployed address of this querying contract.
   * @returns {Contract | undefined} a {@link Contract} object if it exists, otherwise it returns undefined.
   */
  public getContract(chainId: number, address: string): Contract | undefined {
    check(ethers.utils.isAddress(address), `address ${address} is invalid`);
    const contractData = this.db.contracts.findOne({ chainId, address });
    return contractData ? new Contract(contractData) : undefined;
  }

  /**
   * @desc get an array of {@link Contract} with the given filtering/sorting/pagination criteria.
   * @param {QueryParam} [params={}] an object contains the search criteria.
   * @param {Function} [params.filterFunc] a filter function used as where clause. The filter function's
   * input is an instance of {@link Contract}, it should return a boolean value to indicate whether that
   * record meets the criteria.
   * @param {string} [params.sortBy] specifies the sorting field, the returned array will be sorted based
   * that field.
   * @param {boolean} [params.desc] whether the returned array should be sorted in descending order.
   * @param {number} [params.offset] the starting offset for the returned array of instances. This is
   * normally used for pagination.
   * @param {number} [params.limit] the maximum number of instances this query should return. This is
   * normally used for pagination.
   * @returns {Contract[]} an array of {@link Contract} which meets the search criteria.
   */
  public getContracts(params: QueryParam = {}): Contract[] {
    let queryChain = this.db.contracts.chain();
    const { filterFunc, sortBy, desc, offset, limit } = params;
    if (filterFunc) {
      queryChain = queryChain.where((raw: Object) => filterFunc(new Contract(raw)));
    }
    if (sortBy) {
      queryChain = queryChain.simplesort(sortBy, desc || false);
    }
    if (offset) {
      queryChain = queryChain.offset(offset);
    }
    if (limit) {
      queryChain = queryChain.limit(limit);
    }
    return queryChain.data().map((rawObject) => new Contract(rawObject));
  }

  public async updateContract(contract: Contract): Promise<Contract> {
    this.db.contracts.update(contract.data);
    await this.saveDatabase();
    return contract;
  }

  /**
   * @desc update the synchronized block number to the given new number.
   * @param {number} chainId chain id of this querying contract.
   * @param {string} address the deployed address of this querying contract.
   * @param {number} syncedBlock the new number.
   * @returns {Promise<void>}
   */
  async updateSyncedBlock(chainId: number, address: string, syncedBlock: number): Promise<void> {
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

  private upsertContractConfig(chainId: number, contractConfig: ContractConfig) {
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
