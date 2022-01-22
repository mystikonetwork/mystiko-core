import { ethers } from 'ethers';
import { check } from '../utils.js';

/**
 * @class BaseConfig
 * @desc common base class of configuration. It contains some useful helper functions.
 */
export class BaseConfig {
  constructor(rawConfig) {
    check(rawConfig && rawConfig instanceof Object, 'rawConfig invalid');
    this.rawConfig = rawConfig;
    this.config = JSON.parse(JSON.stringify(rawConfig)); // deep copy
  }

  /**
   * @desc get the human-readable JSON string of this config.
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this.rawConfig, null, 2);
  }

  /**
   * @desc check whether given key exists in the config.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @returns {boolean} true if it exists, otherwise returns false.
   */
  static isKeyExists(config, key) {
    return !!(config && key && config instanceof Object && config[key]);
  }

  /**
   * @desc check whether given key exists in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @throws {Error} if the specified key does not exist.
   */
  static checkKeyExists(config, key) {
    check(BaseConfig.isKeyExists(config, key), key + ' does not exist in config');
  }

  /**
   * @desc check whether the corresponding value of given key is string in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not string type, or key does not exist if the requestExists
   * set to be true.
   */
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

  /**
   * @desc check whether the corresponding value of given key is number in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not number type, or key does not exist if the requestExists
   * set to be true.
   */
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

  /**
   * @desc check whether the corresponding value of given key is Object in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not Object instance, or key does not exist if the requestExists
   * set to be true.
   */
  static checkObject(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(config[key] instanceof Object, 'value of ' + key + ' is not Object type');
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }

  /**
   * @desc check whether the corresponding value of given key is an array of number in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not an array of number,
   * or key does not exist if the requestExists set to be true.
   */
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

  /**
   * @desc check whether the corresponding value of given key is an array of string in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not an array of string,
   * or key does not exist if the requestExists set to be true.
   */
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

  /**
   * @desc check whether the corresponding value of given key is an array of Object in the config, if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is not an array of Object,
   * or key does not exist if the requestExists set to be true.
   */
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

  /**
   * @desc check whether the corresponding value of given key is a valid Ethereum address in the config,
   * if not, raise error.
   * @param {Object} config an object contains configuration.
   * @param {string} key the key of configuration.
   * @param {boolean} requireExists if true, it will raise error if given key does not exist.
   * @throws {Error} if the value of specified key is an invalid Ethereum address,
   * or key does not exist if the requestExists set to be true.
   */
  static checkEthAddress(config, key, requireExists = true) {
    if (BaseConfig.isKeyExists(config, key)) {
      check(ethers.utils.isAddress(config[key]), config[key] + ' is invalid address');
    } else if (requireExists) {
      BaseConfig.checkKeyExists(config, key);
    }
  }
}
