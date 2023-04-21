import { DepositContractConfig } from '@mystikonetwork/config';
import { Contract, DatabaseQuery } from '@mystikonetwork/database';
import { ContractHandler, ContractOptions, MystikoContextInterface } from '../../../interface';
import { MystikoHandler } from '../../handler';

export class ContractHandlerV2 extends MystikoHandler implements ContractHandler {
  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.contracts = this;
  }

  public find(query?: DatabaseQuery<Contract>): Promise<Contract[]> {
    return this.db.contracts.find(query).exec();
  }

  public findOne(options: ContractOptions | string): Promise<Contract | null> {
    if (typeof options === 'string') {
      return this.db.contracts.findOne(options).exec();
    }
    const selector = { chainId: options.chainId, contractAddress: options.address };
    return this.db.contracts.findOne({ selector }).exec();
  }

  public init(): Promise<Contract[]> {
    const promises: Promise<Contract>[] = [];
    const chainConfigs = this.config.chains;
    for (let i = 0; i < chainConfigs.length; i += 1) {
      const chainConfig = chainConfigs[i];
      const { poolContracts, depositContractsWithDisabled } = chainConfig;
      const contracts = [...poolContracts, ...depositContractsWithDisabled];
      for (let j = 0; j < contracts.length; j += 1) {
        const contract = contracts[j];
        const now = MystikoHandler.now();
        const eventFilterSize = chainConfig.getEventFilterSizeByAddress(contract.address);
        const disabled = contract instanceof DepositContractConfig ? contract.disabled : false;
        promises.push(
          this.findOne({ chainId: chainConfig.chainId, address: contract.address }).then(
            (existingContract) => {
              if (existingContract) {
                return existingContract.atomicUpdate((data) => {
                  data.disabled = disabled ? 1 : 0;
                  data.syncSize = eventFilterSize;
                  data.updatedAt = now;
                  return data;
                });
              }
              return this.db.contracts.insert({
                id: MystikoHandler.generateId(),
                updatedAt: now,
                createdAt: now,
                chainId: chainConfig.chainId,
                contractAddress: contract.address,
                type: contract.type,
                disabled: disabled ? 1 : 0,
                syncStart: contract.startBlock,
                syncSize: eventFilterSize,
                syncedBlockNumber: contract.startBlock,
              });
            },
          ),
        );
      }
    }
    return Promise.all(promises);
  }

  public resetSync(options: string | ContractOptions): Promise<Contract | null> {
    return this.findOne(options).then((contract) => {
      if (contract != null) {
        return this.context.chains.findOne(contract.chainId).then((chain) => {
          if (chain) {
            this.logger.warn(
              `resetting syncedBlockNumber of contract from chainId = ${chain.chainId}, ` +
                `address = ${contract.contractAddress} to ${contract.syncStart}`,
            );
            return contract
              .atomicUpdate((data) => {
                data.checkedLeafIndex = undefined;
                data.syncedBlockNumber = contract.syncStart;
                data.updatedAt = MystikoHandler.now();
                return data;
              })
              .then((updatedContract) => {
                if (chain.syncedBlockNumber > updatedContract.syncStart) {
                  return chain
                    .atomicUpdate((data) => {
                      data.syncedBlockNumber = updatedContract.syncStart;
                      data.updatedAt = MystikoHandler.now();
                      return data;
                    })
                    .then(() => updatedContract);
                }
                return Promise.resolve(updatedContract);
              });
          }
          return null;
        });
      }
      return contract;
    });
  }
}
