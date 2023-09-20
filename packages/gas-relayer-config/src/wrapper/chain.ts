import { AssetType, CircuitType } from '@mystikonetwork/config';
import { BaseConfig } from './base';
import { RawChainConfig, TransactionConfig, GasCost } from '../raw';
import { ContractConfig } from './contract';

export class ChainConfig extends BaseConfig<RawChainConfig> {
  private readonly contractConfigs: ContractConfig[];

  constructor(data: RawChainConfig) {
    super(data);
    this.contractConfigs = this.data.contracts.map((raw) => new ContractConfig(raw));
  }

  public get name(): string {
    return this.data.name;
  }

  public get chainId(): number {
    return this.data.chainId;
  }

  public get assetSymbol(): string {
    return this.data.assetSymbol;
  }

  public get relayerContractAddress(): string {
    return this.data.relayerContractAddress;
  }

  public get contracts(): ContractConfig[] {
    return this.contractConfigs;
  }

  public get transaction(): TransactionConfig {
    return this.data.transactionInfo;
  }

  public get mainGasCost(): GasCost {
    return this.data.transactionInfo.mainGasCost;
  }

  public get erc20GasCost(): GasCost {
    return this.data.transactionInfo.erc20GasCost;
  }

  public getContractBySymbol(symbol: string): ContractConfig | undefined {
    let config: ContractConfig | undefined;
    this.contractConfigs.forEach((contract) => {
      if (contract.assetSymbol === symbol) {
        config = contract;
      }
    });

    return config;
  }

  /* eslint-disable */
  public getGasCostByAssetAndCircuitType(assetType: AssetType, circuitType: CircuitType): number {
    let gasCostConfig: GasCost;
    if (assetType === AssetType.MAIN) {
      gasCostConfig = this.mainGasCost;
    } else {
      gasCostConfig = this.erc20GasCost;
    }
    switch (circuitType) {
      case CircuitType.TRANSACTION1x0:
        return gasCostConfig.transaction1x0;
      case CircuitType.TRANSACTION1x1:
        return gasCostConfig.transaction1x1;
      case CircuitType.TRANSACTION1x2:
        return gasCostConfig.transaction1x2;
      case CircuitType.TRANSACTION2x0:
        return gasCostConfig.transaction2x0;
      case CircuitType.TRANSACTION2x1:
        return gasCostConfig.transaction2x1;
      case CircuitType.TRANSACTION2x2:
        return gasCostConfig.transaction2x2;
      default:
        return 0;
    }
  }
}
