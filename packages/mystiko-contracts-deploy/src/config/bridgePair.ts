import { check } from '@mystikonetwork/utils';
import { ContractDeployConfig, RawContractDeployConfig } from './bridgeDeploy';
import { BaseConfig } from './base';

export interface RawBridgeDepositPairConfig {
  pair: RawContractDeployConfig[];
  wrappedTokens: ContractDeployConfig[];
}

export class BridgeDepositPairConfig extends BaseConfig {
  // first key is network, second key is token asset symbol
  private readonly tokenByNetworkAndToken = new Map();

  constructor(rawConfig: any) {
    super(rawConfig);
    this.asRawBridgeTokenPairConfig().wrappedTokens = this.asRawBridgeTokenPairConfig().pair.map(
      (deposit) => {
        const depositCfg = new ContractDeployConfig(deposit);
        this.insertDepositConfig(depositCfg);
        return depositCfg;
      },
    );

    check(
      this.asRawBridgeTokenPairConfig().wrappedTokens.length === 1 ||
        this.asRawBridgeTokenPairConfig().wrappedTokens.length === 2,
      'wasmFile is empty',
    );
  }

  insertDepositConfig(depositCfg: ContractDeployConfig) {
    let m1 = this.tokenByNetworkAndToken.get(depositCfg.network);
    if (m1 === undefined) {
      m1 = new Map();
      m1.set(depositCfg.token, depositCfg);
      this.tokenByNetworkAndToken.set(depositCfg.network, m1);
    } else {
      check(m1.get(depositCfg.token) === undefined, 'pair configure error');
      m1.set(depositCfg.token, depositCfg);
    }
  }

  public get pairTokens(): ContractDeployConfig[] {
    return Object.values(this.asRawBridgeTokenPairConfig().wrappedTokens);
  }

  public getPairDepositCfg(network: string, token: string): ContractDeployConfig | undefined {
    return this.tokenByNetworkAndToken.get(network)?.get(token);
  }

  public getPairPeerDepositCfg(
    network: string,
    token: string,
    dstNetwork: string,
  ): ContractDeployConfig | undefined {
    if (this.pairTokens.length === 1) {
      check(network === dstNetwork, 'src network must same with dst network');
      return this.getPairDepositCfg(network, token);
    }
    const m1 = this.tokenByNetworkAndToken.get(dstNetwork);

    let depost: any;
    m1.forEach((value: ContractDeployConfig) => {
      if (value.token !== token || value.network !== network) {
        depost = value;
      }
    });
    return depost;
  }

  private asRawBridgeTokenPairConfig(): RawBridgeDepositPairConfig {
    return this.config as RawBridgeDepositPairConfig;
  }
}
