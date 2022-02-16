import BN from 'bn.js';
import { ethers } from 'ethers';
import * as fastfile from 'fastfile';

/**
 * @external external:BN
 * @see {@link https://github.com/indutny/bn.js/ BN}
 */
/**
 * @module module:mystiko/utils
 * @desc collection of utilization functions.
 */
/**
 * @memberOf module:mystiko/utils
 * @name module:mystiko/utils.BN_LEN
 * @type {number}
 * @desc default number of bytes of Big Number.
 */
export const BN_LEN = 32;

/**
 * @function module:mystiko/utils.bnToFixedBytes
 * @desc convert a BN instance to a bytes buffer.
 * @param {external:BN} bn an object of {@link external:BN}.
 * @returns {Buffer} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export function bnToFixedBytes(bn) {
  if (!(bn instanceof BN)) {
    throw 'invalid bn instance, it should be BN';
  }
  const hexString = bn.toString(16);
  if (hexString.length > BN_LEN * 2) {
    throw 'given big number exceeds ' + BN_LEN;
  }
  const paddingLen = BN_LEN * 2 - hexString.length;
  let paddingZeros = '';
  for (let i = 0; i < paddingLen; i++) {
    paddingZeros = paddingZeros + '0';
  }
  return Buffer.from(paddingZeros + hexString, 'hex');
}

/**
 * @function module:mystiko/utils.check
 * @desc check whether given condition holds. If condition fails, it raises Error with given message.
 * @param {boolean} condition an evaluating expression.
 * @param {string} message to throw if condition fails.
 */
export function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @function module:mystiko/utils.checkNotNull
 * @desc check given arg is not null, if it is null, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is null.
 */
export function checkNotNull(arg, message) {
  check(arg !== null, message);
}

/**
 * @function module:mystiko/utils.checkDefined
 * @desc check given arg is defined, if it is undefined, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is undefined.
 */
export function checkDefined(arg, message) {
  check(arg !== undefined, message);
}

/**
 * @function module:mystiko/utils.checkDefinedAndNotNull
 * @desc check given arg is defined and not null, if it is null or undefined, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is null or undefined.
 */
export function checkDefinedAndNotNull(arg, message) {
  checkNotNull(arg, message);
  checkDefined(arg, message);
}

/**
 * @function module:mystiko/utils.toBuff
 * @desc convert a string instance into Node.js Buffer.
 * @param {string} strData data tobe converted.
 * @returns {Buffer} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export function toBuff(strData) {
  check(typeof strData === 'string', 'unsupported type ' + strData);
  return Buffer.from(toHexNoPrefix(strData), 'hex');
}

/**
 * @function module:mystiko/utils.toDecimals
 * @desc convert a number into big number with given decimals. This is useful for calling smart contract functions.
 * @param {number} amount number to be converted.
 * @param {number} [decimals=18] number of precision bits of converted big number.
 * @returns {external:BN} a instance of {@link external:BN}
 */
export function toDecimals(amount, decimals = 18) {
  check(typeof amount === 'number', 'amount should be a number');
  check(typeof decimals === 'number', 'decimals should be a number');
  const converted = ethers.utils.parseUnits(toString(amount), decimals);
  return new BN(toString(converted));
}

/**
 * @function module:mystiko/utils.fromDecimals
 * @desc convert a number into big number with given decimals. This is useful for calling smart contract functions.
 * @param {external:BN} bn a big number.
 * @param {number} [decimals=18] number of precision bits of converted big number.
 * @returns {amount} converted simple amount.
 */
export function fromDecimals(bn, decimals = 18) {
  check(bn instanceof BN, 'bn should be an instance of BN');
  check(typeof decimals === 'number', 'decimals should be a number');
  return parseFloat(ethers.utils.formatUnits(toString(bn), decimals));
}

/**
 * @function module:mystiko/utils.toFixedLenHex
 * @desc convert an object into fixed length of hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|external:BN} hex object to be converted.
 * @param {number} [length=32] length of the converted hex string (without leading '0x').
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toFixedLenHex(hex, length = 32) {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return toHex(hex.slice(2).padStart(length * 2, '0'));
    }
    return toHex(hex.padStart(length * 2, '0'));
  } else if (hex instanceof BN) {
    return toFixedLenHex(hex.toString(16), length);
  } else if (hex instanceof Buffer) {
    return toFixedLenHex(hex.toString('hex'), length);
  } else if (hex instanceof Uint8Array) {
    return toFixedLenHex(Buffer.from(hex), length);
  } else if (typeof hex === 'number') {
    return toFixedLenHex(new BN(hex), length);
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

/**
 * @function module:mystiko/utils.toHex
 * @desc convert an object into hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|external:BN} hex object to be converted.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toHex(hex) {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x') {
      return hex;
    } else if (hex.slice(0, 2) === '0X') {
      return '0x' + hex.slice(2);
    }
    return '0x' + hex;
  } else if (hex instanceof BN) {
    return toHex(hex.toString(16));
  } else if (hex instanceof Buffer) {
    return toHex(hex.toString('hex'));
  } else if (hex instanceof Uint8Array) {
    return toHex(Buffer.from(hex));
  } else if (typeof hex === 'number') {
    return toHex(new BN(hex));
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

/**
 * @function module:mystiko/utils.toFixedLenHexNoPrefix
 * @desc convert an object into fixed length of hex string *without* '0x'.
 * @param {string|number|Buffer|Uint8Array|external:BN} hex object to be converted.
 * @param {number} [length=32] length of the converted hex string.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toFixedLenHexNoPrefix(hex, length = 32) {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return toHexNoPrefix(hex.slice(2).padStart(length * 2, '0'));
    }
    return toHexNoPrefix(hex.padStart(length * 2, '0'));
  } else if (hex instanceof BN) {
    return toFixedLenHexNoPrefix(hex.toString(16), length);
  } else if (hex instanceof Buffer) {
    return toFixedLenHexNoPrefix(hex.toString('hex'), length);
  } else if (hex instanceof Uint8Array) {
    return toFixedLenHexNoPrefix(Buffer.from(hex), length);
  } else if (typeof hex === 'number') {
    return toFixedLenHexNoPrefix(new BN(hex), length);
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

/**
 * @function module:mystiko/utils.toHexNoPrefix
 * @desc convert an object into hex string.
 * @param {string|number|Buffer|Uint8Array|external:BN} hex object to be converted.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toHexNoPrefix(hex) {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return hex.slice(2);
    }
    return hex;
  } else if (hex instanceof BN) {
    return hex.toString(16);
  } else if (hex instanceof Buffer) {
    return hex.toString('hex');
  } else if (hex instanceof Uint8Array) {
    return toHexNoPrefix(Buffer.from(hex));
  } else if (typeof hex === 'number') {
    return toHexNoPrefix(new BN(hex));
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

/**
 * @function module:mystiko/utils.toString
 * @desc convert an object into string.
 * @param {Object} object an object instance.
 * @returns {string} converted string.
 */
export function toString(object) {
  return object ? object.toString() : '';
}

/**
 * @function module:mystiko/utils.readFile
 * @desc read a file's whole content with given path.
 * @param {string} path file's path, it could be a URL or a file system path.
 * @param {number|undefined} [cacheSize] cache size for this file.
 * @param {number|undefined} [pageSize] page size for this file.
 * @returns {Promise<Buffer>} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export async function readFile(path, cacheSize = undefined, pageSize = undefined) {
  check(typeof path === 'string', 'path should be string');
  check(!cacheSize || typeof cacheSize === 'number', 'cacheSize should be number');
  check(!pageSize || typeof pageSize === 'number', 'pageSize should be number');
  const fd = await fastfile.readExisting(path, cacheSize, pageSize);
  const data = await fd.read(fd.totalSize);
  await fd.close();
  return Buffer.from(data);
}

/**
 * @function module:mystiko/utils.readJsonFile
 * @desc read a file's whole content with given path, and parse it as JSON.
 * @param  {string} path file's path, it could be a URL or a file system path.
 * @returns {Object} parsed JSON object.
 */
export async function readJsonFile(path) {
  const data = await readFile(path);
  return JSON.parse(data);
}

/**
 * @function module:mystiko/utils.deepCopy
 * @desc deep copy an object by using JSON serialize/deserialize.
 * @param {any} object the object to be deeply copied.
 * @returns {any} deeply copied object.
 */
export function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * @function module:mystiko/utils.errorMessage
 * @desc get error message from the caught error.
 * @param {any} error the error object.
 * @returns {string} error message.
 */
export function errorMessage(error) {
  if (!error) {
    return '';
  } else if (error instanceof Error) {
    return error.toString();
  } else if (error instanceof Object) {
    return JSON.stringify(error);
  } else {
    return error.toString();
  }
}
