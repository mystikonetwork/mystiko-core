/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import type { AssetPool, AssetPoolInterface } from '../AssetPool';

const _abi = [
  {
    inputs: [],
    name: 'assetType',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export class AssetPool__factory {
  static readonly abi = _abi;
  static createInterface(): AssetPoolInterface {
    return new utils.Interface(_abi) as AssetPoolInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): AssetPool {
    return new Contract(address, _abi, signerOrProvider) as AssetPool;
  }
}