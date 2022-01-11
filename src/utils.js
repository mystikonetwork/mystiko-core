import { BigNumber } from 'bignumber.js';

export const BN_LEN = 32;
export function bnToFixedBytes(bn) {
  if (!(bn instanceof BigNumber)) {
    throw 'invalid bn instance, it should be BigNumber';
  }
  const hexString = bn.toString(16);
  if (hexString.length > BN_LEN * 2) {
    throw 'given bigNumber exceeds ' + BN_LEN;
  }
  const paddingLen = BN_LEN * 2 - hexString.length;
  let paddingZeros = '';
  for (let i = 0; i < paddingLen; i++) {
    paddingZeros = paddingZeros + '0';
  }
  return Buffer.from(paddingZeros + hexString, 'hex');
}

export function check(condition, message) {
  if (!condition) {
    throw message;
  }
}

export function checkNotNull(arg, message) {
  check(arg != null, message);
}

export function checkDefined(arg, message) {
  check(arg != undefined, message);
}

export function checkDefinedAndNotNull(arg, message) {
  checkNotNull(arg, message);
  checkDefined(arg, message);
}
