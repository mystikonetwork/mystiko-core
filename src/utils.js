import BN from 'bn.js';
import * as fastfile from 'fastfile';

export const BN_LEN = 32;
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

export function check(condition, message) {
  if (!condition) {
    throw new Error(message);
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

export function toBuff(strData) {
  check(typeof strData === 'string', 'unsupported type ' + strData);
  return Buffer.from(toHexNoPrefix(strData), 'hex');
}

export function toDecimals(amount, decimals) {
  const base = new BN(10).pow(new BN(decimals));
  return new BN(amount).mul(base);
}

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
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

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
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

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
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

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
  }
  throw new Error('given type ' + typeof hex + ' is not supported');
}

export async function readFile(path) {
  check(typeof path === 'string', 'path should be string');
  const fd = await fastfile.readExisting(path);
  const data = await fd.read(fd.totalSize);
  await fd.close();
  return Buffer.from(data);
}

export async function readJsonFile(path) {
  const data = await readFile(path);
  return JSON.parse(data);
}
