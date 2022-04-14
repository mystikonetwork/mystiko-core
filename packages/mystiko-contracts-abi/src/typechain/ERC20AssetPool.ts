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

export interface ERC20AssetPoolInterface extends utils.Interface {
  contractName: 'ERC20AssetPool';
  functions: {
    'asset()': FunctionFragment;
    'assetDecimals()': FunctionFragment;
    'assetName()': FunctionFragment;
    'assetSymbol()': FunctionFragment;
    'assetType()': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'asset', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetDecimals', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetName', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetSymbol', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetType', values?: undefined): string;

  decodeFunctionResult(functionFragment: 'asset', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetDecimals', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetName', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetSymbol', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetType', data: BytesLike): Result;

  events: {};
}

export interface ERC20AssetPool extends BaseContract {
  contractName: 'ERC20AssetPool';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ERC20AssetPoolInterface;

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
    asset(overrides?: CallOverrides): Promise<[string]>;

    assetDecimals(overrides?: CallOverrides): Promise<[number]>;

    assetName(overrides?: CallOverrides): Promise<[string]>;

    assetSymbol(overrides?: CallOverrides): Promise<[string]>;

    assetType(overrides?: CallOverrides): Promise<[string]>;
  };

  asset(overrides?: CallOverrides): Promise<string>;

  assetDecimals(overrides?: CallOverrides): Promise<number>;

  assetName(overrides?: CallOverrides): Promise<string>;

  assetSymbol(overrides?: CallOverrides): Promise<string>;

  assetType(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    asset(overrides?: CallOverrides): Promise<string>;

    assetDecimals(overrides?: CallOverrides): Promise<number>;

    assetName(overrides?: CallOverrides): Promise<string>;

    assetSymbol(overrides?: CallOverrides): Promise<string>;

    assetType(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    asset(overrides?: CallOverrides): Promise<BigNumber>;

    assetDecimals(overrides?: CallOverrides): Promise<BigNumber>;

    assetName(overrides?: CallOverrides): Promise<BigNumber>;

    assetSymbol(overrides?: CallOverrides): Promise<BigNumber>;

    assetType(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    asset(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetDecimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetName(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetSymbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetType(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}