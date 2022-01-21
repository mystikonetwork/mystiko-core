import { BaseConfig } from './common.js';

export class CircuitConfig extends BaseConfig {
  constructor(rawConfig) {
    super(rawConfig);
    BaseConfig.checkString(this.config, 'name');
    BaseConfig.checkString(this.config, 'wasmFile');
    BaseConfig.checkString(this.config, 'zkeyFile');
    BaseConfig.checkString(this.config, 'vkeyFile');
  }

  get name() {
    return this.config['name'];
  }

  get wasmFile() {
    return this.config['wasmFile'];
  }

  get zkeyFile() {
    return this.config['zkeyFile'];
  }

  get vkeyFile() {
    return this.config['vkeyFile'];
  }
}
