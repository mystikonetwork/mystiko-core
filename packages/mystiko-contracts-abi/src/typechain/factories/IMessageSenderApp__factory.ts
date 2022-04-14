/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import type { IMessageSenderApp, IMessageSenderAppInterface } from '../IMessageSenderApp';

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_dstChainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
    ],
    name: 'sendMessage',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_receiver',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'uint64',
        name: '_dstChainId',
        type: 'uint64',
      },
      {
        internalType: 'uint64',
        name: '_nonce',
        type: 'uint64',
      },
      {
        internalType: 'uint32',
        name: '_maxSlippage',
        type: 'uint32',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
      {
        internalType: 'enum MessageSenderLib.BridgeType',
        name: '_bridgeType',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: '_fee',
        type: 'uint256',
      },
    ],
    name: 'sendMessageWithTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

export class IMessageSenderApp__factory {
  static readonly abi = _abi;
  static createInterface(): IMessageSenderAppInterface {
    return new utils.Interface(_abi) as IMessageSenderAppInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): IMessageSenderApp {
    return new Contract(address, _abi, signerOrProvider) as IMessageSenderApp;
  }
}
