import BN from 'bn.js';
import { fromDecimals } from '@mystikonetwork/utils';

export function fromDecimalsWithPrecision(bn: BN | string, decimals?: number): number {
  const amount = fromDecimals(bn, decimals);
  return Math.ceil(amount * 1e8) / 1e8;
}
