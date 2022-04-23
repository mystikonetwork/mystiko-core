import { check } from '@mystikonetwork/utils';
import { BridgeProxyConfig, RawBridgeProxyConfig } from './bridgeProxy';
import { ContractDeployConfig, RawContractDeployConfig } from './bridgeDeploy';
import { BridgeDepositPairConfig, RawBridgeDepositPairConfig } from './bridgePair';
import { BaseConfig } from './base';

export interface RawBridgeConfig {
  name: string;
  contractName: string;
  proxys: RawBridgeProxyConfig[];
  commitmentPools: RawContractDeployConfig[];
  pairs: RawBridgeDepositPairConfig[];
  wrappedProxys: BridgeProxyConfig[];
  wrappedCommitmentPools: ContractDeployConfig[];
  wrappedPairs: BridgeDepositPairConfig[];
}

export class BridgeConfig extends BaseConfig {
  private readonly proxyByNetwork: { [key: string]: BridgeProxyConfig };

  // first key is network, second key is token
  // private readonly poolByNetworkAndToken: { [key: string]: { [key: string]: ContractDeployConfig } };
  private readonly poolByNetworkAndToken = new Map();

  // first key is src network, second key is src token, third is dst network
  private readonly pairByNetworkAndToken = new Map();

  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'contractName');

    this.proxyByNetwork = {};
    this.asRawBridgeConfig().wrappedProxys = this.asRawBridgeConfig().proxys.map((proxy) => {
      const proxyConfig = new BridgeProxyConfig(proxy);
      this.proxyByNetwork[proxy.network] = proxyConfig;
      return proxyConfig;
    });

    this.asRawBridgeConfig().wrappedCommitmentPools = this.asRawBridgeConfig().commitmentPools.map((pool) => {
      const poolConfig = new ContractDeployConfig(pool);
      this.insertPoolConfig(pool.network, pool.token, poolConfig);
      return poolConfig;
    });

    this.asRawBridgeConfig().wrappedPairs = this.asRawBridgeConfig().pairs.map((pair) => {
      const pairCfg = new BridgeDepositPairConfig(pair);
      check(pairCfg.pairTokens.length === 1 || pairCfg.pairTokens.length === 2, 'token pair configure error');

      const src = pairCfg.pairTokens[0];
      if (pairCfg.pairTokens.length === 1) {
        this.insertPairConfig(src.network, src.token, src.network, pairCfg);
      } else {
        const dst = pairCfg.pairTokens[1];
        this.insertPairConfig(src.network, src.token, dst.network, pairCfg);
        this.insertPairConfig(dst.network, dst.token, src.network, pairCfg);
      }

      return pairCfg;
    });
  }

  insertPoolConfig(network: string, token: string, poolConfig: ContractDeployConfig) {
    let m1 = this.poolByNetworkAndToken.get(network);
    if (m1 === undefined) {
      m1 = new Map();
      m1.set(token, poolConfig);
      this.poolByNetworkAndToken.set(network, m1);
    } else {
      check(m1.get(token) === undefined, 'pool configure duplicate');
      m1.set(token, poolConfig);
    }
  }

  public insertPairConfig(
    srcNetwork: string,
    token: string,
    dstNetwork: string,
    pairCfg: BridgeDepositPairConfig,
  ) {
    let m1 = this.pairByNetworkAndToken.get(srcNetwork);
    if (m1 === undefined) {
      const m2 = new Map();
      m2.set(dstNetwork, pairCfg);
      m1 = new Map();
      m1.set(token, m2);
      this.pairByNetworkAndToken.set(srcNetwork, m1);
    } else {
      let m2 = m1.get(token);
      if (m2 === undefined) {
        m2 = new Map();
        m2.set(dstNetwork, pairCfg);
        m1.set(token, m2);
      } else {
        check(m2.get(dstNetwork) === undefined, 'pair config duplicate');
        m2.set(dstNetwork, pairCfg);
      }
    }
  }

  public get name(): string {
    return this.asRawBridgeConfig().name;
  }

  public get contractName(): string {
    return this.asRawBridgeConfig().contractName;
  }

  public getBridgeProxyConfig(network: string): BridgeProxyConfig | undefined {
    return this.proxyByNetwork[network];
  }

  public getBridgeCommitmentPool(network: string, token: string): ContractDeployConfig | undefined {
    return this.poolByNetworkAndToken.get(network)?.get(token);
  }

  public getBridgeTokenPair(
    srcNetwork: string,
    token: string,
    dstNetwork: string,
  ): BridgeDepositPairConfig | undefined {
    return this.pairByNetworkAndToken.get(srcNetwork)?.get(token)?.get(dstNetwork);
  }

  private asRawBridgeConfig(): RawBridgeConfig {
    return this.config as RawBridgeConfig;
  }
}
