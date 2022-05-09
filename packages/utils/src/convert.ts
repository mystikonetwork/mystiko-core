import BN from 'bn.js';
import { ethers } from 'ethers';
import { isBN, toBN } from './bignumber';

/**
 * @function module:mystiko/utils.toString
 * @desc convert an object into string.
 * @param {Object} object an object instance.
 * @returns {string} converted string.
 */
export function toString(object: any): string {
  return object !== undefined && object !== null ? object.toString() : '';
}

export function toFixedString(num: number): string {
  if (Math.abs(num) < 1) {
    const e = parseInt(num.toString().split('e-')[1], 10);
    if (e) {
      const newNum = 10 ** (e - 1) * num;
      return `0.${new Array(e).join('0')}${newNum.toString().substring(2)}`;
    }
  } else {
    let e = parseInt(num.toString().split('+')[1], 10);
    let newNum = num;
    if (e > 20) {
      e -= 20;
      newNum /= 10 ** e;
      return `${newNum.toString()}${new Array(e + 1).join('0')}`;
    }
  }
  return num.toString();
}

/**
 * @function module:mystiko/utils.toDecimals
 * @desc convert a number into big number with given decimals. This is useful for calling smart contract functions.
 * @param {number} amount number to be converted.
 * @param {number} [decimals=18] number of precision bits of converted big number.
 * @returns {BN} a instance of {@link BN}
 */
export function toDecimals(amount: number, decimals: number = 18): BN {
  const converted = ethers.utils.parseUnits(toFixedString(amount), decimals);
  return toBN(toString(converted));
}

/**
 * @function module:mystiko/utils.fromDecimals
 * @desc convert a number into big number with given decimals. This is useful for calling smart contract functions.
 * @param {BN} bn a big number.
 * @param {number} [decimals=18] number of precision bits of converted big number.
 * @returns {amount} converted simple amount.
 */
export function fromDecimals(bn: BN | string, decimals = 18): number {
  return parseFloat(ethers.utils.formatUnits(toString(bn), decimals));
}

/**
 * @function module:mystiko/utils.toHex
 * @desc convert an object into hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toHex(hex: string | number | Buffer | Uint8Array | BN): string {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x') {
      return hex;
    }
    if (hex.slice(0, 2) === '0X') {
      return `0x${hex.slice(2)}`;
    }
    return `0x${hex}`;
  }
  if (isBN(hex)) {
    // @ts-ignore
    return toHex(hex.toString(16));
  }
  if (hex instanceof Buffer) {
    return toHex(hex.toString('hex'));
  }
  if (hex instanceof Uint8Array) {
    return toHex(Buffer.from(hex));
  }
  if (typeof hex === 'number') {
    return toHex(toBN(hex));
  }
  throw new Error(`unsupported hex type ${typeof hex}`);
}

/**
 * @function module:mystiko/utils.toFixedLenHex
 * @desc convert an object into fixed length of hex string with padding start '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
 * @param {number} [length=32] length of the converted hex string (without leading '0x').
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toFixedLenHex(hex: string | number | Buffer | Uint8Array | BN, length: number = 32): string {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return toHex(hex.slice(2).padStart(length * 2, '0'));
    }
    return toHex(hex.padStart(length * 2, '0'));
  }
  if (isBN(hex)) {
    // @ts-ignore
    return toFixedLenHex(hex.toString(16), length);
  }
  if (hex instanceof Buffer) {
    return toFixedLenHex(hex.toString('hex'), length);
  }
  if (hex instanceof Uint8Array) {
    return toFixedLenHex(Buffer.from(hex), length);
  }
  if (typeof hex === 'number') {
    return toFixedLenHex(toBN(hex), length);
  }
  throw new Error(`unsupported hex type ${typeof hex}`);
}

/**
 * @function module:mystiko/utils.toHexNoPrefix
 * @desc convert an object into hex string.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toHexNoPrefix(hex: string | number | Buffer | Uint8Array | BN): string {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return hex.slice(2);
    }
    return hex;
  }
  if (isBN(hex)) {
    // @ts-ignore
    return hex.toString(16);
  }
  if (hex instanceof Buffer) {
    return hex.toString('hex');
  }
  if (hex instanceof Uint8Array) {
    return toHexNoPrefix(Buffer.from(hex));
  }
  if (typeof hex === 'number') {
    return toHexNoPrefix(toBN(hex));
  }
  throw new Error(`unsupported hex type ${typeof hex}`);
}

/**
 * @function module:mystiko/utils.toFixedLenHexNoPrefix
 * @desc convert an object into fixed length of hex string *without* '0x'.
 * @param {string|number|Buffer|Uint8Array|BN} hex object to be converted.
 * @param {number} [length=32] length of the converted hex string.
 * @returns {string} a hex string.
 * @throws Error if given type is not supported.
 */
export function toFixedLenHexNoPrefix(
  hex: string | number | Buffer | Uint8Array | BN,
  length: number = 32,
): string {
  if (typeof hex === 'string') {
    if (hex.slice(0, 2) === '0x' || hex.slice(0, 2) === '0X') {
      return toHexNoPrefix(hex.slice(2).padStart(length * 2, '0'));
    }
    return toHexNoPrefix(hex.padStart(length * 2, '0'));
  }
  if (isBN(hex)) {
    // @ts-ignore
    return toFixedLenHexNoPrefix(hex.toString(16), length);
  }
  if (hex instanceof Buffer) {
    return toFixedLenHexNoPrefix(hex.toString('hex'), length);
  }
  if (hex instanceof Uint8Array) {
    return toFixedLenHexNoPrefix(Buffer.from(hex), length);
  }
  if (typeof hex === 'number') {
    return toFixedLenHexNoPrefix(toBN(hex), length);
  }
  throw new Error(`unsupported hex type ${typeof hex}`);
}

/**
 * @function module:mystiko/utils.toBuff
 * @desc convert a string instance into Node.js Buffer.
 * @param {string} strData data tobe converted.
 * @returns {Buffer} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export function toBuff(strData: string): Buffer {
  return Buffer.from(toHexNoPrefix(strData), 'hex');
}

/**
 * @function module:mystiko/utils.deepCopy
 * @desc deep copy an object by using JSON serialize/deserialize.
 * @param {any} object the object to be deeply copied.
 * @returns {any} deeply copied object.
 */
export function deepCopy<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}
