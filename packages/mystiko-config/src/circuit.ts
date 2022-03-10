import { check } from '@mystiko/utils';
import { BaseConfig } from './base';

export interface RawCircuitConfig {
  name: string;
  wasmFile: string | string[];
  zkeyFile: string | string[];
  vkeyFile: string | string[];
}

/**
 * @class CircuitConfig
 * @extends BaseConfig
 * @param {Object} rawConfig raw configuration object.
 * @desc configuration class for the zero knowledge proof scheme resources.
 */
export class CircuitConfig extends BaseConfig {
  constructor(rawConfig: any) {
    super(rawConfig);
    BaseConfig.checkStringOrStringArray(this.config, 'name');
    BaseConfig.checkStringOrStringArray(this.config, 'wasmFile');
    check(this.wasmFile.length > 0, 'wasmFile is empty');
    BaseConfig.checkStringOrStringArray(this.config, 'zkeyFile');
    check(this.zkeyFile.length > 0, 'zkeyFile is empty');
    BaseConfig.checkStringOrStringArray(this.config, 'vkeyFile');
    check(this.vkeyFile.length > 0, 'vkeyFile is empty');
  }

  /**
   * @property {string} name
   * @desc the name of this zkp scheme.
   */
  public get name(): string {
    return this.asRawCircuitConfig().name;
  }

  /**
   * @property {string} wasmFile
   * @desc URL or file path of the compiled WASM version of zkSnark circuit.
   */
  public get wasmFile(): string[] {
    const raw = this.asRawCircuitConfig().wasmFile;
    return raw instanceof Array ? raw : [raw];
  }

  /**
   * @property {string} zkeyFile
   * @desc URL or file path of the generated public proving keys for the zkSnark circuit after the trusted setup.
   */
  public get zkeyFile(): string[] {
    const raw = this.asRawCircuitConfig().zkeyFile;
    return raw instanceof Array ? raw : [raw];
  }

  /**
   * @property {string} vkeyFile
   * @desc URL or file path of the generated public verifying keys for the zkSnark circuit after the trusted setup.
   */
  public get vkeyFile(): string[] {
    const raw = this.asRawCircuitConfig().vkeyFile;
    return raw instanceof Array ? raw : [raw];
  }

  private asRawCircuitConfig(): RawCircuitConfig {
    return this.config as RawCircuitConfig;
  }
}
