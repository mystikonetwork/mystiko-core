import BN from 'bn.js';
import { check } from './check';

/**
 * @memberOf module:mystiko/utils
 * @name module:mystiko/utils.BN_LEN
 * @type {number}
 * @desc default number of bytes of Big Number.
 */
export const BN_LEN: number = 32;

/**
 * @function module:mystiko/utils.isBN
 * @desc whether an object is an instance of BN.
 * @param {any} object the object to be detected.
 * @returns {boolean} true if it is an instance of BN, otherwise it returns false.
 */
export function isBN(object: any): boolean {
  return BN.isBN(object);
}

/**
 * @function module:mystiko/utils.toBN
 * @desc convert an object to big number.
 * @param {number|string|number[]|Uint8Array|Buffer|BN} number the object to be converted
 * @param {number|string} [base] convert base
 * @param {string} [endian] endianness
 * @returns {BN} the converted BN instance.
 */
export function toBN(
  number: number | string | number[] | Uint8Array | Buffer | BN,
  base?: number | 'hex',
  endian?: BN.Endianness,
): BN {
  return new BN(number, base, endian);
}

/**
 * @function module:mystiko/utils.bnToFixedBytes
 * @desc convert a BN instance to a bytes buffer.
 * @param {BN} bn an object of {@link BN}.
 * @returns {Buffer} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export function bnToFixedBytes(bn: BN): Buffer {
  const hexString = bn.toString(16);
  check(hexString.length <= BN_LEN * 2, `given big number exceeds ${BN_LEN}`);
  const paddingLen = BN_LEN * 2 - hexString.length;
  let paddingZeros = '';
  for (let i = 0; i < paddingLen; i += 1) {
    paddingZeros = `${paddingZeros}0`;
  }
  return Buffer.from(paddingZeros + hexString, 'hex');
}
