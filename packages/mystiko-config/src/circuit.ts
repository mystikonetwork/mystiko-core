import { BaseConfig } from './base';

export interface RawCircuitConfig {
  name: string;
  wasmFile: string;
  zkeyFile: string;
  vkeyFile: string;
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
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'wasmFile');
    BaseConfig.checkString(this.config, 'zkeyFile');
    BaseConfig.checkString(this.config, 'vkeyFile');
  }

  /**
   * @property {string} name
   * @desc the name of this zkp scheme.
   */
  get name() {
    return this.asRawCircuitConfig().name;
  }

  /**
   * @property {string} wasmFile
   * @desc URL or file path of the compiled WASM version of zkSnark circuit.
   */
  get wasmFile() {
    return this.asRawCircuitConfig().wasmFile;
  }

  /**
   * @property {string} zkeyFile
   * @desc URL or file path of the generated public proving keys for the zkSnark circuit after the trusted setup.
   */
  get zkeyFile() {
    return this.asRawCircuitConfig().zkeyFile;
  }

  /**
   * @property {string} vkeyFile
   * @desc URL or file path of the generated public verifying keys for the zkSnark circuit after the trusted setup.
   */
  get vkeyFile() {
    return this.asRawCircuitConfig().vkeyFile;
  }

  private asRawCircuitConfig(): RawCircuitConfig {
    return this.config as RawCircuitConfig;
  }
}
