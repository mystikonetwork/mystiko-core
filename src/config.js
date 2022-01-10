import { isAddress } from 'web3-utils';
import * as fastfile from 'fastfile';

function isKeyExists(config, key) {
  if (config[key] == null && config[key] == undefined) {
    return false;
  }
  return true;
}

function checkKeyExists(config, key) {
  if (config[key] == null && config[key] == undefined) {
    throw 'key ' + key + ' cannot be null';
  }
  if ((typeof config[key] === 'string' || config[key] instanceof String) && config[key].length === 0) {
    throw 'key ' + key + ' cannot be empty';
  }
}

function checkAddress(config, key) {
  checkKeyExists(config, key);
  if (!isAddress(config[key])) {
    throw 'invalid address ' + config[key];
  }
}

function checkNumber(config, key) {
  checkKeyExists(config, key);
  if (!Number.isInteger(config[key])) {
    throw 'invalid integer ' + config[key];
  }
}

function checkNumberArray(config, key) {
  checkKeyExists(config, key);
  if (!(config[key] instanceof Array)) {
    throw 'invalid array ' + config[key];
  }
  config[key].forEach((item) => {
    if (!Number.isInteger(item)) {
      throw 'invalid integer ' + item;
    }
  });
}

export class BaseConfig {
  constructor(config) {
    if (!config) {
      throw 'config cannot be null';
    }
    this.rawConfig = config;
    this.config = JSON.parse(JSON.stringify(config)); // Deep copy
  }

  toString() {
    return JSON.stringify(this.rawConfig, null, 2);
  }
}

export class BridgeTokenConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkKeyExists(config, 'name');
    checkAddress(config, 'srcTokenAddress');
    checkAddress(config, 'dstTokenAddress');
    checkAddress(config, 'srcProtocolAddress');
    checkAddress(config, 'dstProtocolAddress');
    checkNumberArray(config, 'allowedAmounts');
    checkNumber(config, 'decimal');
  }

  get name() {
    return this.config['name'];
  }

  get srcTokenAddress() {
    return this.config['srcTokenAddress'];
  }

  get dstTokenAddress() {
    return this.config['dstTokenAddress'];
  }

  get srcProtocolAddress() {
    return this.config['srcProtocolAddress'];
  }

  get dstProtocolAddress() {
    return this.config['dstProtocolAddress'];
  }

  get allowedAmounts() {
    return this.config['allowedAmounts'];
  }

  get decimal() {
    return this.config['decimal'];
  }
}

export class LoopTokenConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkKeyExists(config, 'name');
    checkAddress(config, 'tokenAddress');
    checkAddress(config, 'protocolAddress');
    checkNumberArray(config, 'allowedAmounts');
    checkNumber(config, 'decimal');
  }

  get name() {
    return this.config['name'];
  }

  get tokenAddress() {
    return this.config['tokenAddress'];
  }

  get protocolAddress() {
    return this.config['protocolAddress'];
  }

  get allowedAmounts() {
    return this.config['allowedAmounts'];
  }

  get decimal() {
    return this.config['decimal'];
  }
}

export class BridgeConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkKeyExists(config, 'name');
    checkKeyExists(config, 'tokens');
    Object.keys(config['tokens']).forEach((token) => {
      this.config['tokens'][token] = new BridgeTokenConfig(config['tokens'][token]);
    });
  }

  get name() {
    return this.config['name'];
  }

  get tokens() {
    return this.config['tokens'];
  }

  getTokenConfig(token) {
    return this.config['tokens'][token];
  }
}

export class CrossChainConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkNumber(config, 'srcChainId');
    checkNumber(config, 'dstChainId');
    checkKeyExists(config, 'bridges');
    Object.keys(config['bridges']).forEach((bridge) => {
      this.config['bridges'][bridge] = new BridgeConfig(config['bridges'][bridge]);
    });
  }

  get srcChainId() {
    return this.config['srcChainId'];
  }

  get dstChainId() {
    return this.config['dstChainId'];
  }

  get bridges() {
    return this.config['bridges'];
  }

  getBridgeConfig(bridge) {
    return this.config['bridges'][bridge];
  }
}

export class SameChainConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkNumber(config, 'chainId');
    checkKeyExists(config, 'tokens');
    Object.keys(config['tokens']).forEach((token) => {
      this.config['tokens'][token] = new LoopTokenConfig(config['tokens'][token]);
    });
  }

  get chainId() {
    return this.config['chainId'];
  }

  get tokens() {
    return this.config['tokens'];
  }

  getTokenConfig(token) {
    return this.config['tokens'][token];
  }
}

export class FileConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkKeyExists(config, 'path');
    checkKeyExists(config, 'md5sum');
  }

  get path() {
    return this.config['path'];
  }

  get md5sum() {
    return this.config['md5sum'];
  }
}

export class AbiConfig extends BaseConfig {
  constructor(config) {
    super(config);
    if (isKeyExists(config, 'crossChainAbi')) {
      this.config['crossChainAbi'] = new FileConfig(config['crossChainAbi']);
    }
    if (isKeyExists(config, 'sameChainAbi')) {
      this.config['sameChainAbi'] = new FileConfig(config['sameChainAbi']);
    }
  }

  get crossChainAbi() {
    return this.config['crossChainAbi'] ? this.config['crossChainAbi'] : null;
  }

  get sameChainAbi() {
    return this.config['sameChainAbi'] ? this.config['sameChainAbi'] : null;
  }
}

export class WithdrawZkpConfig extends BaseConfig {
  constructor(config) {
    super(config);
    checkKeyExists(config, 'wasmFile');
    checkKeyExists(config, 'zkeyFile');
    this.config['wasmFile'] = new FileConfig(config['wasmFile']);
    this.config['zkeyFile'] = new FileConfig(config['zkeyFile']);
  }

  get wasmFile() {
    return this.config['wasmFile'];
  }

  get zkeyFile() {
    return this.config['zkeyFile'];
  }
}

export class ZkpConfig extends BaseConfig {
  constructor(config) {
    super(config);
    if (isKeyExists(config, 'withdraw')) {
      this.config['withdraw'] = new WithdrawZkpConfig(config['withdraw']);
    }
  }

  get withdrawZkpConfig() {
    return this.config['withdraw'] ? this.config['withdraw'] : null;
  }
}

export class MystikoConfig extends BaseConfig {
  constructor(config) {
    super(config);
    if (isKeyExists(config, 'abi')) {
      this.config['abi'] = new AbiConfig(config['abi']);
    }
    if (isKeyExists(config, 'zkp')) {
      this.config['zkp'] = new ZkpConfig(config['zkp']);
    }
    if (isKeyExists(config, 'crossChains')) {
      Object.keys(config['crossChains']).forEach((crossChain) => {
        this.config['crossChains'][crossChain] = new CrossChainConfig(config['crossChains'][crossChain]);
      });
    }
    if (isKeyExists(config, 'sameChains')) {
      Object.keys(config['sameChains']).forEach((sameChain) => {
        this.config['sameChains'][sameChain] = new SameChainConfig(config['sameChains'][sameChain]);
      });
    }
  }

  get abi() {
    return this.config['abi'] ? this.config['abi'] : null;
  }

  get zkp() {
    return this.config['zkp'] ? this.config['zkp'] : null;
  }

  get crossChains() {
    return this.config['crossChains'] ? this.config['crossChains'] : null;
  }

  getCrossChainConfig(srcChainId, dstChainId) {
    if (isKeyExists(this.config, 'crossChains')) {
      return this.config['crossChains'][srcChainId + '-' + dstChainId]
        ? this.config['crossChains'][srcChainId + '-' + dstChainId]
        : null;
    }
    return null;
  }

  get sameChains() {
    return this.config['sameChains'] ? this.config['sameChains'] : null;
  }

  getSameChainConfig(chainId) {
    if (isKeyExists(this.config, 'sameChains')) {
      return this.config['sameChains'][chainId] ? this.config['sameChains'][chainId] : null;
    }
    return null;
  }
}

export async function createConfig(configFile) {
  const file = await fastfile.readExisting(configFile);
  const fileBuffer = await file.read(file.totalSize);
  await file.close();
  const config = JSON.parse(Buffer.from(fileBuffer));
  return new MystikoConfig(config);
}
