/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from 'ethers';
import { FunctionFragment, Result } from '@ethersproject/abi';
import { Listener, Provider } from '@ethersproject/providers';
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from './common';

export declare namespace IMystikoLoop {
  export type DepositRequestStruct = {
    amount: BigNumberish;
    commitment: BigNumberish;
    hashK: BigNumberish;
    randomS: BigNumberish;
    encryptedNote: BytesLike;
    rollupFee: BigNumberish;
  };

  export type DepositRequestStructOutput = [BigNumber, BigNumber, BigNumber, BigNumber, string, BigNumber] & {
    amount: BigNumber;
    commitment: BigNumber;
    hashK: BigNumber;
    randomS: BigNumber;
    encryptedNote: string;
    rollupFee: BigNumber;
  };
}

export interface MystikoV2WithLoopERC20Interface extends utils.Interface {
  contractName: 'MystikoV2WithLoopERC20';
  functions: {
    'FIELD_SIZE()': FunctionFragment;
    'asset()': FunctionFragment;
    'assetDecimals()': FunctionFragment;
    'assetName()': FunctionFragment;
    'assetSymbol()': FunctionFragment;
    'assetType()': FunctionFragment;
    'associatedCommitmentPool()': FunctionFragment;
    'bridgeType()': FunctionFragment;
    'changeOperator(address)': FunctionFragment;
    'deposit((uint256,uint256,uint256,uint128,bytes,uint256))': FunctionFragment;
    'hasher3()': FunctionFragment;
    'isDepositsDisabled()': FunctionFragment;
    'minAmount()': FunctionFragment;
    'operator()': FunctionFragment;
    'sanctionsContract()': FunctionFragment;
    'setAssociatedCommitmentPool(address)': FunctionFragment;
    'setMinAmount(uint256)': FunctionFragment;
    'toggleDeposits(bool)': FunctionFragment;
    'toggleSanctionCheck(bool)': FunctionFragment;
    'updateSanctionContractAddress(address)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'FIELD_SIZE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'asset', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetDecimals', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetName', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetSymbol', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetType', values?: undefined): string;
  encodeFunctionData(functionFragment: 'associatedCommitmentPool', values?: undefined): string;
  encodeFunctionData(functionFragment: 'bridgeType', values?: undefined): string;
  encodeFunctionData(functionFragment: 'changeOperator', values: [string]): string;
  encodeFunctionData(functionFragment: 'deposit', values: [IMystikoLoop.DepositRequestStruct]): string;
  encodeFunctionData(functionFragment: 'hasher3', values?: undefined): string;
  encodeFunctionData(functionFragment: 'isDepositsDisabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'minAmount', values?: undefined): string;
  encodeFunctionData(functionFragment: 'operator', values?: undefined): string;
  encodeFunctionData(functionFragment: 'sanctionsContract', values?: undefined): string;
  encodeFunctionData(functionFragment: 'setAssociatedCommitmentPool', values: [string]): string;
  encodeFunctionData(functionFragment: 'setMinAmount', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'toggleDeposits', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'toggleSanctionCheck', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'updateSanctionContractAddress', values: [string]): string;

  decodeFunctionResult(functionFragment: 'FIELD_SIZE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'asset', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetDecimals', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetName', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetSymbol', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetType', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'associatedCommitmentPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'bridgeType', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'changeOperator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'deposit', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'hasher3', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isDepositsDisabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'minAmount', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'operator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'sanctionsContract', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setAssociatedCommitmentPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setMinAmount', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleDeposits', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleSanctionCheck', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'updateSanctionContractAddress', data: BytesLike): Result;

  events: {};
}

export interface MystikoV2WithLoopERC20 extends BaseContract {
  contractName: 'MystikoV2WithLoopERC20';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MystikoV2WithLoopERC20Interface;

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
    FIELD_SIZE(overrides?: CallOverrides): Promise<[BigNumber]>;

    asset(overrides?: CallOverrides): Promise<[string]>;

    assetDecimals(overrides?: CallOverrides): Promise<[number]>;

    assetName(overrides?: CallOverrides): Promise<[string]>;

    assetSymbol(overrides?: CallOverrides): Promise<[string]>;

    assetType(overrides?: CallOverrides): Promise<[string]>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<[string]>;

    bridgeType(overrides?: CallOverrides): Promise<[string]>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    deposit(
      _request: IMystikoLoop.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    hasher3(overrides?: CallOverrides): Promise<[string]>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<[boolean]>;

    minAmount(overrides?: CallOverrides): Promise<[BigNumber]>;

    operator(overrides?: CallOverrides): Promise<[string]>;

    sanctionsContract(overrides?: CallOverrides): Promise<[string]>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    toggleDeposits(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;
  };

  FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

  asset(overrides?: CallOverrides): Promise<string>;

  assetDecimals(overrides?: CallOverrides): Promise<number>;

  assetName(overrides?: CallOverrides): Promise<string>;

  assetSymbol(overrides?: CallOverrides): Promise<string>;

  assetType(overrides?: CallOverrides): Promise<string>;

  associatedCommitmentPool(overrides?: CallOverrides): Promise<string>;

  bridgeType(overrides?: CallOverrides): Promise<string>;

  changeOperator(
    _newOperator: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  deposit(
    _request: IMystikoLoop.DepositRequestStruct,
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  hasher3(overrides?: CallOverrides): Promise<string>;

  isDepositsDisabled(overrides?: CallOverrides): Promise<boolean>;

  minAmount(overrides?: CallOverrides): Promise<BigNumber>;

  operator(overrides?: CallOverrides): Promise<string>;

  sanctionsContract(overrides?: CallOverrides): Promise<string>;

  setAssociatedCommitmentPool(
    _commitmentPoolAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setMinAmount(
    _minAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  toggleDeposits(
    _state: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  toggleSanctionCheck(
    _check: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  updateSanctionContractAddress(
    _sanction: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  callStatic: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    asset(overrides?: CallOverrides): Promise<string>;

    assetDecimals(overrides?: CallOverrides): Promise<number>;

    assetName(overrides?: CallOverrides): Promise<string>;

    assetSymbol(overrides?: CallOverrides): Promise<string>;

    assetType(overrides?: CallOverrides): Promise<string>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<string>;

    bridgeType(overrides?: CallOverrides): Promise<string>;

    changeOperator(_newOperator: string, overrides?: CallOverrides): Promise<void>;

    deposit(_request: IMystikoLoop.DepositRequestStruct, overrides?: CallOverrides): Promise<void>;

    hasher3(overrides?: CallOverrides): Promise<string>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<boolean>;

    minAmount(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<string>;

    sanctionsContract(overrides?: CallOverrides): Promise<string>;

    setAssociatedCommitmentPool(_commitmentPoolAddress: string, overrides?: CallOverrides): Promise<void>;

    setMinAmount(_minAmount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    toggleDeposits(_state: boolean, overrides?: CallOverrides): Promise<void>;

    toggleSanctionCheck(_check: boolean, overrides?: CallOverrides): Promise<void>;

    updateSanctionContractAddress(_sanction: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {};

  estimateGas: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    asset(overrides?: CallOverrides): Promise<BigNumber>;

    assetDecimals(overrides?: CallOverrides): Promise<BigNumber>;

    assetName(overrides?: CallOverrides): Promise<BigNumber>;

    assetSymbol(overrides?: CallOverrides): Promise<BigNumber>;

    assetType(overrides?: CallOverrides): Promise<BigNumber>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<BigNumber>;

    bridgeType(overrides?: CallOverrides): Promise<BigNumber>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    deposit(
      _request: IMystikoLoop.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    hasher3(overrides?: CallOverrides): Promise<BigNumber>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<BigNumber>;

    minAmount(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<BigNumber>;

    sanctionsContract(overrides?: CallOverrides): Promise<BigNumber>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    toggleDeposits(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    asset(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetDecimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetName(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetSymbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    assetType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bridgeType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    deposit(
      _request: IMystikoLoop.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    hasher3(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minAmount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    operator(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sanctionsContract(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    toggleDeposits(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;
  };
}
