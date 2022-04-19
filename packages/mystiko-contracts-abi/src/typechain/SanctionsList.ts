/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from 'ethers';
import { FunctionFragment, Result } from '@ethersproject/abi';
import { Listener, Provider } from '@ethersproject/providers';
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from './common';

export interface SanctionsListInterface extends utils.Interface {
  contractName: 'SanctionsList';
  functions: {
    'isSanctioned(address)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'isSanctioned', values: [string]): string;

  decodeFunctionResult(functionFragment: 'isSanctioned', data: BytesLike): Result;

  events: {};
}

export interface SanctionsList extends BaseContract {
  contractName: 'SanctionsList';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: SanctionsListInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined,
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    isSanctioned(addr: string, overrides?: CallOverrides): Promise<[boolean]>;
  };

  isSanctioned(addr: string, overrides?: CallOverrides): Promise<boolean>;

  callStatic: {
    isSanctioned(addr: string, overrides?: CallOverrides): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    isSanctioned(addr: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    isSanctioned(addr: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
