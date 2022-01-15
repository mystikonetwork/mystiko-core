import { ethers } from 'ethers';
import { check } from '../utils.js';

export class BaseConfig {
  constructor(rawConfig) {
    check(rawConfig && rawConfig instanceof Object, 'rawConfig invalid');
    this.rawConfig = rawConfig;
    this.config = JSON.parse(JSON.stringify(rawConfig)); // deep copy
  }

  toString() {
    return JSON.stringify(this.rawConfig, null, 2);
  }

  static isKeyExists(config, key) {
    if (config && key && config instanceof Object && config[key]) {
      return true;
    }
    return false;
  }

  static checkKeyExists(config, key) {
    check(BaseConfig.isKeyExists(config, key), key + ' does not exist in config');
  }

  static checkString(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(
        typeof config[key] === 'string' || config[key] instanceof String,
        'value of ' + key + ' is not string nor String type',
      );
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkNumber(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(
        typeof config[key] === 'number' || config[key] instanceof Number,
        'value of ' + key + ' is not number nor Number type',
      );
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkObject(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(config[key] instanceof Object, 'value of ' + key + ' is not Object type');
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkNumberArray(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(config[key] instanceof Array, 'value of ' + key + ' is not Array type');
      config[key].forEach((item) => {
        check(typeof item === 'number' || item instanceof Number, item + ' is not number nor Number type');
      });
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkStringArray(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(config[key] instanceof Array, 'value of ' + key + ' is not Array type');
      config[key].forEach((item) => {
        check(typeof item === 'string' || item instanceof String, item + ' is not string nor String type');
      });
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkObjectArray(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(config[key] instanceof Array, 'value of ' + key + ' is not Array type');
      config[key].forEach((item) => {
        check(item instanceof Object, item + ' is not Object type');
      });
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  static checkEthAddress(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(ethers.utils.isAddress(config[key]), config[key] + ' is invalid address');
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }
}
