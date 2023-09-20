import axios from 'axios';
import { RawRelayerConfig } from '../relayer';
import { BaseConfig } from './base';
import { RawConfig } from '../raw';
import { ChainConfig } from './chain';

export const CONFIG_BASE_URL = 'https://static.mystiko.network/relayer_config';

export type ConfigRemoteOptions = {
  isTestnet?: boolean;
  isStaging?: boolean;
  gitRevision?: string;
  baseUrl?: string;
};

export class RelayerConfig extends BaseConfig<RawRelayerConfig> {
  private readonly chainConfigs: Map<number, ChainConfig>;

  protected constructor(data: RawRelayerConfig) {
    super(data);
    this.chainConfigs = this.initChainConfigs();
  }

  public get version(): string {
    return this.data.version;
  }

  public get chains(): ChainConfig[] {
    return Array.from(this.chainConfigs.values());
  }

  public getChainConfig(chainId: number): ChainConfig | undefined {
    return this.chainConfigs.get(chainId);
  }

  public static createFromFile(jsonFile: string): Promise<RelayerConfig> {
    return RawConfig.createFromFile(RawRelayerConfig, jsonFile).then((raw) => new RelayerConfig(raw));
  }

  public static createFromRaw(raw: RawRelayerConfig): Promise<RelayerConfig> {
    return raw.validate().then(() => new RelayerConfig(raw));
  }

  public static createFromPlain(plain: Object): Promise<RelayerConfig> {
    return RawConfig.createFromObject(RawRelayerConfig, plain).then((raw) =>
      RelayerConfig.createFromRaw(raw),
    );
  }

  public static createFromRemote(options?: ConfigRemoteOptions): Promise<RelayerConfig> {
    const wrappedOptions: ConfigRemoteOptions = options || {};
    const baseUrl = wrappedOptions.baseUrl || CONFIG_BASE_URL;
    const environment = wrappedOptions.isStaging ? 'staging' : 'production';
    const network = wrappedOptions.isTestnet ? 'testnet' : 'mainnet';
    let url = `${baseUrl}/${environment}/${network}/latest.json`;
    if (wrappedOptions.gitRevision) {
      url = `${baseUrl}/${environment}/${network}/${wrappedOptions.gitRevision}/config.json`;
    }
    return axios.get(url).then((response) => RelayerConfig.createFromPlain(response.data));
  }

  public static createDefaultTestnetConfig(): Promise<RelayerConfig> {
    return RelayerConfig.createFromRemote({ isTestnet: true });
  }

  public static createDefaultMainnetConfig(): Promise<RelayerConfig> {
    return RelayerConfig.createFromRemote();
  }

  private initChainConfigs(): Map<number, ChainConfig> {
    const chainConfigs = new Map<number, ChainConfig>();
    this.data.chains.forEach((raw) => {
      chainConfigs.set(raw.chainId, new ChainConfig(raw));
    });
    return chainConfigs;
  }
}
