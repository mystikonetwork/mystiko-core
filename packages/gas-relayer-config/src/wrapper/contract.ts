import BN from 'bn.js';
import { toBN } from '@mystikonetwork/utils';
import { BaseConfig } from './base';
import { RawContractConfig } from '../raw';

export class ContractConfig extends BaseConfig<RawContractConfig> {
  public get assetSymbol(): string {
    return this.data.assetSymbol;
  }

  public get relayerFeeOfTenThousandth(): number {
    return this.data.relayerFeeOfTenThousandth;
  }

  public get minimumGasFee(): BN {
    return toBN(this.data.minimumGasFee);
  }

  public set minimumGasFee(minimumGasFee: BN) {
    this.data.minimumGasFee = minimumGasFee.toString();
  }

  public mutate(data?: RawContractConfig): ContractConfig {
    return new ContractConfig(data || this.data);
  }
}
