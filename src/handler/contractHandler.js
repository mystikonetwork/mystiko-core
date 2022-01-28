import { ethers } from 'ethers';

import { Handler } from './handler.js';
import { Contract } from '../model';
import { check } from '../utils.js';

export class ContractHandler extends Handler {
  constructor(db, config) {
    super(db, config);
  }

  async importFromConfig() {
    this.config.chains.forEach((chainConfig) => {
      chainConfig.contracts.forEach((contractConfig) => {
        this._upsertContractConfig(chainConfig.chainId, contractConfig);
      });
    });
    await this.saveDatabase();
  }

  getContract(chainId, address) {
    check(typeof chainId === 'number', 'chainId should a number type');
    check(ethers.utils.isAddress(address), `address ${address} is invalid`);
    const contractData = this.db.contracts.findOne({ chainId, address });
    return contractData ? new Contract(contractData) : undefined;
  }

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

  async updateSyncedBlock(chainId, address, syncedBlock) {
    check(typeof syncedBlock === 'number', 'syncedBlock should a number type');
    const contract = this.getContract(chainId, address);
    if (contract) {
      contract.syncedBlock = syncedBlock;
      this.db.contracts.update(contract.data);
      await this.saveDatabase();
    }
  }

  _upsertContractConfig(chainId, contractConfig) {
    let contract = this.getContract(chainId, contractConfig.address);
    if (!contract) {
      contract = new Contract();
    }
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
    } else {
      this.db.contracts.insert(contract.data);
    }
  }
}
