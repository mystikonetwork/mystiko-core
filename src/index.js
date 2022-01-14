import { createConfig } from './config.js';

export default class Mysitko {
  async start(configPath) {
    this.config = await createConfig(configPath);
  }
}
