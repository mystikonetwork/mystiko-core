import BN from 'bn.js';
import * as fastfile from 'fastfile';

/**
 * @module module:mystiko/utils
 * @desc collection of utilization functions.
 */
/**
 * @memberOf module:mystiko/utils
 * @type {number}
 * @desc default number of bytes of Big Number.
 */
export const BN_LEN = 32;

/**
 * @memberOf module:mystiko/utils
 * @desc convert a BN instance to a bytes buffer.
 * @param {BN} bn an object of {@link https://github.com/indutny/bn.js/ bn.js}.
 * @returns {Buffer} @see {@link https://nodejs.org/api/buffer.html Node.js Buffer}
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
 * @memberOf module:mystiko/utils
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
 * @memberOf module:mystiko/utils
 * @desc check given arg is not null, if it is null, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is null.
 */
export function checkNotNull(arg, message) {
  check(arg !== null, message);
}

/**
 * @memberOf module:mystiko/utils
 * @desc check given arg is defined, if it is undefined, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is undefined.
 */
export function checkDefined(arg, message) {
  check(arg !== undefined, message);
}

/**
 * @memberOf module:mystiko/utils
 * @desc check given arg is defined and not null, if it is null or undefined, raise Error with given message.
 * @param {Object} arg any object.
 * @param {string} message to throw if arg is null or undefined.
 */
export function checkDefinedAndNotNull(arg, message) {
  checkNotNull(arg, message);
  checkDefined(arg, message);
}

/**
 * @memberOf module:mystiko/utils
 * @desc convert a string instance into Node.js Buffer.
 * @param {string} strData data tobe converted.
 * @returns {Buffer} @see {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export function toBuff(strData) {
  check(typeof strData === 'string', 'unsupported type ' + strData);
  return Buffer.from(toHexNoPrefix(strData), 'hex');
}

/**
 * @memberOf module:mystiko/utils
 * @desc convert a number into big number with given decimals. This is useful for calling smart contract functions.
 * @param {number} amount number to be converted.
 * @param {number} decimals number of precision bits of converted big number.
 * @returns {BN} @see {@link https://github.com/indutny/bn.js/ bn.js}
 */
export function toDecimals(amount, decimals) {
  check(typeof amount === 'number', 'amount should be a number');
  check(typeof decimals === 'number', 'decimals should be a number');
  while (amount < 1 && decimals > 0) {
    amount = amount * 10;
    decimals = decimals - 1;
  }
  const base = new BN(10).pow(new BN(decimals));
  return new BN(amount).mul(base);
}

/**
 * @memberOf module:mystiko/utils
 * @desc convert an object into fixed length of hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
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
 * @memberOf module:mystiko/utils
 * @desc convert an object into hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
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
 * @memberOf module:mystiko/utils
 * @desc convert an object into fixed length of hex string *without* '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
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
 * @memberOf module:mystiko/utils
 * @desc convert an object into hex string.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
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
 * @memberOf module:mystiko/utils
 * @desc convert an object into string.
 * @param {Object} object an object instance.
 * @returns {string} converted string.
 */
export function toString(object) {
  return object ? object.toString() : '';
}

/**
 * @memberOf module:mystiko/utils
 * @desc read a file's whole content with given path.
 * @param path file's path, it could be a URL or a file system path.
 * @returns {Promise<Buffer>} @see {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export async function readFile(path) {
  check(typeof path === 'string', 'path should be string');
  const fd = await fastfile.readExisting(path);
  const data = await fd.read(fd.totalSize);
  await fd.close();
  return Buffer.from(data);
}

/**
 * @memberOf module:mystiko/utils
 * @desc read a file's whole content with given path, and parse it as JSON.
 * @param path file's path, it could be a URL or a file system path.
 * @returns {Object} parsed JSON object.
 */
export async function readJsonFile(path) {
  const data = await readFile(path);
  return JSON.parse(data);
}
