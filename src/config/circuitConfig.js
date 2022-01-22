import { BaseConfig } from './common.js';

/**
 * @class CircuitConfig
 * @extends BaseConfig
 * @desc configuration class for the zero knowledge proof scheme resources.
 */
export class CircuitConfig extends BaseConfig {
  constructor(rawConfig) {
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
    return this.config['name'];
  }

  /**
   * @property {string} wasmFile
   * @desc URL or file path of the compiled WASM version of zkSnark circuit.
   */
  get wasmFile() {
    return this.config['wasmFile'];
  }

  /**
   * @property {string} zkeyFile
   * @desc URL or file path of the generated public proving keys for the zkSnark circuit after the trusted setup.
   */
  get zkeyFile() {
    return this.config['zkeyFile'];
  }

  /**
   * @property {string} vkeyFile
   * @desc URL or file path of the generated public verifying keys for the zkSnark circuit after the trusted setup.
   */
  get vkeyFile() {
    return this.config['vkeyFile'];
  }
}
