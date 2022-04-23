import { BaseConfig } from './base';

export interface RawContractDeployConfig {
  network: string;
  token: string;
  address?: string;
  syncStart?: number;
}

export class ContractDeployConfig extends BaseConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'network');
    BaseConfig.checkString(this.config, 'token');
    BaseConfig.checkNumber(this.config, 'syncStart', false);
    BaseConfig.checkEthAddress(this.config, 'address', false);
  }

  public get network(): string {
    return this.asRawContractDeployConfig().network;
  }

  public get token(): string {
    return this.asRawContractDeployConfig().token;
  }

  public get address(): string {
    return this.asRawContractDeployConfig().address || '';
  }

  public set address(addr: string) {
    this.asRawContractDeployConfig().address = addr;
  }

  public get syncStart(): number {
    return this.asRawContractDeployConfig().syncStart || 1;
  }

  public set syncStart(start: number) {
    this.asRawContractDeployConfig().syncStart = start;
  }

  private asRawContractDeployConfig(): RawContractDeployConfig {
    return this.config as RawContractDeployConfig;
  }
}
