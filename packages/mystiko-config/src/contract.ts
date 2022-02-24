import { check } from '@mystiko/utils';
import { BaseConfig, AssetType, BridgeType } from './base';
import { ContractMeta, MystikoABI, MystikoContractMeta } from './abi';

export interface RawContractConfig {
  version: string;
  name: string;
  address: string;
  bridgeType: BridgeType;
  assetType: AssetType;
  assetAddress?: string;
  assetSymbol: string;
  assetDecimals: number;
  peerChainId?: number;
  peerContractAddress?: string;
  circuits: string;
}

/**
 * @class ContractConfig
 * @extends BaseConfig
 * @param {any} rawConfig raw configuration object.
 * @desc configuration class of the deployed smart contracts of the Mystiko core protocol.
 */
export class ContractConfig extends BaseConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkNumber(this.config, 'version');
    BaseConfig.checkString(this.config, 'name');
    this.checkContractName();
    BaseConfig.checkEthAddress(this.config, 'address');
    BaseConfig.checkString(this.config, 'assetSymbol');
    BaseConfig.checkNumber(this.config, 'assetDecimals');
    if (this.assetType !== AssetType.MAIN) {
      BaseConfig.checkEthAddress(this.config, 'assetAddress');
    }
    if (this.bridgeType !== BridgeType.LOOP) {
      BaseConfig.checkNumber(this.config, 'peerChainId');
      BaseConfig.checkEthAddress(this.config, 'peerContractAddress');
    }
    BaseConfig.checkString(this.config, 'circuits');
  }

  /**
   * @property {number} version
   * @desc the version number of this configured blockchain network.
   */
  public get version(): string {
    return this.asRawContractConfig().version;
  }

  /**
   * @property {string} name
   * @desc the name of this configured smart contract.
   */
  public get name(): string {
    return this.asRawContractConfig().name;
  }

  /**
   * @property {string} address
   * @desc the address of this configured smart contract.
   */
  public get address(): string {
    return this.asRawContractConfig().address;
  }

  /**
   * @property {BridgeType} bridgeType
   * @desc the supported cross-chain bridge type of this configured smart contract.
   */
  public get bridgeType(): BridgeType {
    return (MystikoABI[this.name] as MystikoContractMeta).bridgeType;
  }

  /**
   * @property {string} assetAddress
   * @desc the address of the supported asset in this configured smart contract.
   */
  public get assetAddress(): string | undefined {
    return this.asRawContractConfig().assetAddress;
  }

  /**
   * @property {AssetType} assetType
   * @desc the type of the supported asset in this configured smart contract.
   */
  public get assetType(): AssetType {
    return (MystikoABI[this.name] as MystikoContractMeta).assetType;
  }

  /**
   * @property {string} assetSymbol
   * @desc the symbol of the supported asset in this configured smart contract.
   */
  public get assetSymbol(): string {
    return this.asRawContractConfig().assetSymbol;
  }

  /**
   * @property {number} assetDecimals
   * @desc the number of precision bits of the supported asset in this configured smart contract.
   */
  public get assetDecimals(): number {
    return this.asRawContractConfig().assetDecimals;
  }

  /**
   * @property {Object} abi
   * @desc the compiled ABI encoding information of this configured smart contract.
   */
  public get abi(): any {
    return (MystikoABI[this.name] as MystikoContractMeta).abi;
  }

  /**
   * @property {number} peerChainId
   * @desc the peer chain id of this configured smart contract.
   * It is undefined if the bridge type is loop.
   */
  public get peerChainId(): number | undefined {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.asRawContractConfig().peerChainId;
    }
    return undefined;
  }

  /**
   * @property {string} peerContractAddress
   * @desc the peer chain smart contract address of this configured smart contract.
   * It is undefined if the bridge type is loop.
   */
  public get peerContractAddress(): string | undefined {
    if (this.bridgeType !== BridgeType.LOOP) {
      return this.asRawContractConfig().peerContractAddress;
    }
    return undefined;
  }

  /**
   * @property {string} circuits
   * @desc the scheme name of zkp circuits of this configured smart contract.
   */
  public get circuits(): string {
    return this.asRawContractConfig().circuits;
  }

  private checkContractName() {
    check(!!MystikoABI[this.name], `${this.name} is an invalid contract name`);
    check((MystikoABI[this.name] as ContractMeta).isMystiko, 'not a Mystiko contract');
  }

  private asRawContractConfig(): RawContractConfig {
    return this.config as RawContractConfig;
  }
}