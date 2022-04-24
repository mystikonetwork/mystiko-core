import { BaseConfig } from './base';
import { ChainTokenConfig, RawChainTokenConfig } from './chainToken';

export interface RawChainConfig {
  name: string;
  network: string;
  chainId: number;
  tokens: RawChainTokenConfig[];
  wrappedTokens: ChainTokenConfig[];
  hasher3Address: string;
  rollup1Address: string;
  rollup4Address: string;
  rollup16Address: string;
  transaction1x0VerifierAddress: string;
  transaction1x1VerifierAddress: string;
  transaction1x2VerifierAddress: string;
  transaction2x0VerifierAddress: string;
  transaction2x1VerifierAddress: string;
  transaction2x2VerifierAddress: string;
}

export class ChainConfig extends BaseConfig {
  private readonly tokenBySymbol: { [key: string]: ChainTokenConfig };

  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'network');
    BaseConfig.checkNumber(this.config, 'chainId');
    BaseConfig.checkEthAddress(this.config, 'hasher3Address', false);
    BaseConfig.checkEthAddress(this.config, 'rollup1Address', false);
    BaseConfig.checkEthAddress(this.config, 'rollup4Address', false);
    BaseConfig.checkEthAddress(this.config, 'rollup16Address', false);
    BaseConfig.checkEthAddress(this.config, 'transaction1x0VerifierAddress', false);
    BaseConfig.checkEthAddress(this.config, 'transaction1x1VerifierAddress', false);
    BaseConfig.checkEthAddress(this.config, 'transaction1x2VerifierAddress', false);
    BaseConfig.checkEthAddress(this.config, 'transaction2x0VerifierAddress', false);
    BaseConfig.checkEthAddress(this.config, 'transaction1x1VerifierAddress', false);
    BaseConfig.checkEthAddress(this.config, 'transaction2x2VerifierAddress', false);

    this.tokenBySymbol = {};
    this.asRawChainConfig().wrappedTokens = this.asRawChainConfig().tokens.map((token) => {
      const tokenConfig = new ChainTokenConfig(token);
      this.tokenBySymbol[token.assetSymbol] = tokenConfig;
      return tokenConfig;
    });
  }

  public get name(): string {
    return this.asRawChainConfig().name;
  }

  public get network(): string {
    return this.asRawChainConfig().network;
  }

  public get chainId(): number {
    return this.asRawChainConfig().chainId;
  }

  public getToken(assertSymbol: string): ChainTokenConfig | undefined {
    return this.tokenBySymbol[assertSymbol];
  }

  public get hasher3Address(): string {
    return this.asRawChainConfig().hasher3Address;
  }

  public set hasher3Address(address: string) {
    this.asRawChainConfig().hasher3Address = address;
  }

  public get rollup1Address(): string {
    return this.asRawChainConfig().rollup1Address;
  }

  public set rollup1Address(address: string) {
    this.asRawChainConfig().rollup1Address = address;
  }

  public get rollup4Address(): string {
    return this.asRawChainConfig().rollup4Address;
  }

  public set rollup4Address(address: string) {
    this.asRawChainConfig().rollup4Address = address;
  }

  public get rollup16Address(): string {
    return this.asRawChainConfig().rollup16Address;
  }

  public set rollup16Address(address: string) {
    this.asRawChainConfig().rollup16Address = address;
  }

  public get transaction1x0VerifierAddress(): string {
    return this.asRawChainConfig().transaction1x0VerifierAddress;
  }

  public set transaction1x0VerifierAddress(address: string) {
    this.asRawChainConfig().transaction1x0VerifierAddress = address;
  }

  public get transaction1x1VerifierAddress(): string {
    return this.asRawChainConfig().transaction1x1VerifierAddress;
  }

  public set transaction1x1VerifierAddress(address: string) {
    this.asRawChainConfig().transaction1x1VerifierAddress = address;
  }

  public get transaction1x2VerifierAddress(): string {
    return this.asRawChainConfig().transaction1x2VerifierAddress;
  }

  public set transaction1x2VerifierAddress(address: string) {
    this.asRawChainConfig().transaction1x2VerifierAddress = address;
  }

  public get transaction2x0VerifierAddress(): string {
    return this.asRawChainConfig().transaction2x0VerifierAddress;
  }

  public set transaction2x0VerifierAddress(address: string) {
    this.asRawChainConfig().transaction2x0VerifierAddress = address;
  }

  public get transaction2x1VerifierAddress(): string {
    return this.asRawChainConfig().transaction2x1VerifierAddress;
  }

  public set transaction2x1VerifierAddress(address: string) {
    this.asRawChainConfig().transaction2x1VerifierAddress = address;
  }

  public get transaction2x2VerifierAddress(): string {
    return this.asRawChainConfig().transaction2x2VerifierAddress;
  }

  public set transaction2x2VerifierAddress(address: string) {
    this.asRawChainConfig().transaction2x2VerifierAddress = address;
  }

  public checkBaseAddress(): boolean {
    if (
      this.asRawChainConfig().hasher3Address === undefined ||
      this.asRawChainConfig().hasher3Address === '' ||
      this.asRawChainConfig().rollup1Address === undefined ||
      this.asRawChainConfig().rollup1Address === '' ||
      this.asRawChainConfig().rollup4Address === undefined ||
      this.asRawChainConfig().rollup4Address === '' ||
      this.asRawChainConfig().rollup16Address === undefined ||
      this.asRawChainConfig().rollup16Address === '' ||
      this.asRawChainConfig().transaction1x0VerifierAddress === undefined ||
      this.asRawChainConfig().transaction1x0VerifierAddress === '' ||
      this.asRawChainConfig().transaction1x1VerifierAddress === undefined ||
      this.asRawChainConfig().transaction1x1VerifierAddress === '' ||
      this.asRawChainConfig().transaction1x2VerifierAddress === undefined ||
      this.asRawChainConfig().transaction1x2VerifierAddress === '' ||
      this.asRawChainConfig().transaction2x0VerifierAddress === undefined ||
      this.asRawChainConfig().transaction2x0VerifierAddress === '' ||
      this.asRawChainConfig().transaction2x1VerifierAddress === undefined ||
      this.asRawChainConfig().transaction2x1VerifierAddress === '' ||
      this.asRawChainConfig().transaction2x2VerifierAddress === undefined ||
      this.asRawChainConfig().transaction2x2VerifierAddress === ''
    ) {
      return false;
    }
    return true;
  }

  private asRawChainConfig(): RawChainConfig {
    return this.config as RawChainConfig;
  }
}
