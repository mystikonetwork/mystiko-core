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
import { FunctionFragment, Result, EventFragment } from '@ethersproject/abi';
import { Listener, Provider } from '@ethersproject/providers';
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from './common';

export declare namespace IMystikoBridge {
  export type DepositRequestStruct = {
    amount: BigNumberish;
    commitment: BigNumberish;
    hashK: BigNumberish;
    randomS: BigNumberish;
    encryptedNote: BytesLike;
    bridgeFee: BigNumberish;
    executorFee: BigNumberish;
    rollupFee: BigNumberish;
  };

  export type DepositRequestStructOutput = [
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
  ] & {
    amount: BigNumber;
    commitment: BigNumber;
    hashK: BigNumber;
    randomS: BigNumber;
    encryptedNote: string;
    bridgeFee: BigNumber;
    executorFee: BigNumber;
    rollupFee: BigNumber;
  };
}

export interface MystikoV2BridgeInterface extends utils.Interface {
  contractName: 'MystikoV2Bridge';
  functions: {
    'FIELD_SIZE()': FunctionFragment;
    'assetType()': FunctionFragment;
    'associatedCommitmentPool()': FunctionFragment;
    'bridgeProxyAddress()': FunctionFragment;
    'bridgeType()': FunctionFragment;
    'changeOperator(address)': FunctionFragment;
    'deposit((uint256,uint256,uint256,uint128,bytes,uint256,uint256,uint256))': FunctionFragment;
    'hasher3()': FunctionFragment;
    'isDepositsDisabled()': FunctionFragment;
    'minAmount()': FunctionFragment;
    'minBridgeFee()': FunctionFragment;
    'minExecutorFee()': FunctionFragment;
    'operator()': FunctionFragment;
    'peerChainId()': FunctionFragment;
    'peerContract()': FunctionFragment;
    'peerMinExecutorFee()': FunctionFragment;
    'peerMinRollupFee()': FunctionFragment;
    'sanctionsContract()': FunctionFragment;
    'setAssociatedCommitmentPool(address)': FunctionFragment;
    'setBridgeProxyAddress(address)': FunctionFragment;
    'setMinAmount(uint256)': FunctionFragment;
    'setMinBridgeFee(uint256)': FunctionFragment;
    'setMinExecutorFee(uint256)': FunctionFragment;
    'setPeerMinExecutorFee(uint256)': FunctionFragment;
    'setPeerMinRollupFee(uint256)': FunctionFragment;
    'setpeerContract(uint64,address)': FunctionFragment;
    'toggleDeposits(bool)': FunctionFragment;
    'toggleSanctionCheck(bool)': FunctionFragment;
    'updateSanctionContractAddress(address)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'FIELD_SIZE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'assetType', values?: undefined): string;
  encodeFunctionData(functionFragment: 'associatedCommitmentPool', values?: undefined): string;
  encodeFunctionData(functionFragment: 'bridgeProxyAddress', values?: undefined): string;
  encodeFunctionData(functionFragment: 'bridgeType', values?: undefined): string;
  encodeFunctionData(functionFragment: 'changeOperator', values: [string]): string;
  encodeFunctionData(functionFragment: 'deposit', values: [IMystikoBridge.DepositRequestStruct]): string;
  encodeFunctionData(functionFragment: 'hasher3', values?: undefined): string;
  encodeFunctionData(functionFragment: 'isDepositsDisabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'minAmount', values?: undefined): string;
  encodeFunctionData(functionFragment: 'minBridgeFee', values?: undefined): string;
  encodeFunctionData(functionFragment: 'minExecutorFee', values?: undefined): string;
  encodeFunctionData(functionFragment: 'operator', values?: undefined): string;
  encodeFunctionData(functionFragment: 'peerChainId', values?: undefined): string;
  encodeFunctionData(functionFragment: 'peerContract', values?: undefined): string;
  encodeFunctionData(functionFragment: 'peerMinExecutorFee', values?: undefined): string;
  encodeFunctionData(functionFragment: 'peerMinRollupFee', values?: undefined): string;
  encodeFunctionData(functionFragment: 'sanctionsContract', values?: undefined): string;
  encodeFunctionData(functionFragment: 'setAssociatedCommitmentPool', values: [string]): string;
  encodeFunctionData(functionFragment: 'setBridgeProxyAddress', values: [string]): string;
  encodeFunctionData(functionFragment: 'setMinAmount', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'setMinBridgeFee', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'setMinExecutorFee', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'setPeerMinExecutorFee', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'setPeerMinRollupFee', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'setpeerContract', values: [BigNumberish, string]): string;
  encodeFunctionData(functionFragment: 'toggleDeposits', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'toggleSanctionCheck', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'updateSanctionContractAddress', values: [string]): string;

  decodeFunctionResult(functionFragment: 'FIELD_SIZE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetType', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'associatedCommitmentPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'bridgeProxyAddress', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'bridgeType', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'changeOperator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'deposit', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'hasher3', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isDepositsDisabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'minAmount', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'minBridgeFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'minExecutorFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'operator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'peerChainId', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'peerContract', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'peerMinExecutorFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'peerMinRollupFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'sanctionsContract', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setAssociatedCommitmentPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setBridgeProxyAddress', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setMinAmount', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setMinBridgeFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setMinExecutorFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setPeerMinExecutorFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setPeerMinRollupFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setpeerContract', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleDeposits', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleSanctionCheck', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'updateSanctionContractAddress', data: BytesLike): Result;

  events: {
    'CommitmentCrossChain(uint256)': EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: 'CommitmentCrossChain'): EventFragment;
}

export type CommitmentCrossChainEvent = TypedEvent<[BigNumber], { commitment: BigNumber }>;

export type CommitmentCrossChainEventFilter = TypedEventFilter<CommitmentCrossChainEvent>;

export interface MystikoV2Bridge extends BaseContract {
  contractName: 'MystikoV2Bridge';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MystikoV2BridgeInterface;

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

    assetType(overrides?: CallOverrides): Promise<[string]>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<[string]>;

    bridgeProxyAddress(overrides?: CallOverrides): Promise<[string]>;

    bridgeType(overrides?: CallOverrides): Promise<[string]>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    deposit(
      _request: IMystikoBridge.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    hasher3(overrides?: CallOverrides): Promise<[string]>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<[boolean]>;

    minAmount(overrides?: CallOverrides): Promise<[BigNumber]>;

    minBridgeFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    minExecutorFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    operator(overrides?: CallOverrides): Promise<[string]>;

    peerChainId(overrides?: CallOverrides): Promise<[BigNumber]>;

    peerContract(overrides?: CallOverrides): Promise<[string]>;

    peerMinExecutorFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    peerMinRollupFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    sanctionsContract(overrides?: CallOverrides): Promise<[string]>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setBridgeProxyAddress(
      _bridgeProxyAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setMinBridgeFee(
      _minBridgeFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setMinExecutorFee(
      _minExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setPeerMinExecutorFee(
      _peerMinExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setPeerMinRollupFee(
      _peerMinRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setpeerContract(
      _peerChainId: BigNumberish,
      _peerContract: string,
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

  assetType(overrides?: CallOverrides): Promise<string>;

  associatedCommitmentPool(overrides?: CallOverrides): Promise<string>;

  bridgeProxyAddress(overrides?: CallOverrides): Promise<string>;

  bridgeType(overrides?: CallOverrides): Promise<string>;

  changeOperator(
    _newOperator: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  deposit(
    _request: IMystikoBridge.DepositRequestStruct,
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  hasher3(overrides?: CallOverrides): Promise<string>;

  isDepositsDisabled(overrides?: CallOverrides): Promise<boolean>;

  minAmount(overrides?: CallOverrides): Promise<BigNumber>;

  minBridgeFee(overrides?: CallOverrides): Promise<BigNumber>;

  minExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

  operator(overrides?: CallOverrides): Promise<string>;

  peerChainId(overrides?: CallOverrides): Promise<BigNumber>;

  peerContract(overrides?: CallOverrides): Promise<string>;

  peerMinExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

  peerMinRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

  sanctionsContract(overrides?: CallOverrides): Promise<string>;

  setAssociatedCommitmentPool(
    _commitmentPoolAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setBridgeProxyAddress(
    _bridgeProxyAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setMinAmount(
    _minAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setMinBridgeFee(
    _minBridgeFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setMinExecutorFee(
    _minExecutorFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setPeerMinExecutorFee(
    _peerMinExecutorFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setPeerMinRollupFee(
    _peerMinRollupFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setpeerContract(
    _peerChainId: BigNumberish,
    _peerContract: string,
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

    assetType(overrides?: CallOverrides): Promise<string>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<string>;

    bridgeProxyAddress(overrides?: CallOverrides): Promise<string>;

    bridgeType(overrides?: CallOverrides): Promise<string>;

    changeOperator(_newOperator: string, overrides?: CallOverrides): Promise<void>;

    deposit(_request: IMystikoBridge.DepositRequestStruct, overrides?: CallOverrides): Promise<void>;

    hasher3(overrides?: CallOverrides): Promise<string>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<boolean>;

    minAmount(overrides?: CallOverrides): Promise<BigNumber>;

    minBridgeFee(overrides?: CallOverrides): Promise<BigNumber>;

    minExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<string>;

    peerChainId(overrides?: CallOverrides): Promise<BigNumber>;

    peerContract(overrides?: CallOverrides): Promise<string>;

    peerMinExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

    peerMinRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

    sanctionsContract(overrides?: CallOverrides): Promise<string>;

    setAssociatedCommitmentPool(_commitmentPoolAddress: string, overrides?: CallOverrides): Promise<void>;

    setBridgeProxyAddress(_bridgeProxyAddress: string, overrides?: CallOverrides): Promise<void>;

    setMinAmount(_minAmount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setMinBridgeFee(_minBridgeFee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setMinExecutorFee(_minExecutorFee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setPeerMinExecutorFee(_peerMinExecutorFee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setPeerMinRollupFee(_peerMinRollupFee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setpeerContract(
      _peerChainId: BigNumberish,
      _peerContract: string,
      overrides?: CallOverrides,
    ): Promise<void>;

    toggleDeposits(_state: boolean, overrides?: CallOverrides): Promise<void>;

    toggleSanctionCheck(_check: boolean, overrides?: CallOverrides): Promise<void>;

    updateSanctionContractAddress(_sanction: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    'CommitmentCrossChain(uint256)'(commitment?: BigNumberish | null): CommitmentCrossChainEventFilter;
    CommitmentCrossChain(commitment?: BigNumberish | null): CommitmentCrossChainEventFilter;
  };

  estimateGas: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    assetType(overrides?: CallOverrides): Promise<BigNumber>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<BigNumber>;

    bridgeProxyAddress(overrides?: CallOverrides): Promise<BigNumber>;

    bridgeType(overrides?: CallOverrides): Promise<BigNumber>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    deposit(
      _request: IMystikoBridge.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    hasher3(overrides?: CallOverrides): Promise<BigNumber>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<BigNumber>;

    minAmount(overrides?: CallOverrides): Promise<BigNumber>;

    minBridgeFee(overrides?: CallOverrides): Promise<BigNumber>;

    minExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<BigNumber>;

    peerChainId(overrides?: CallOverrides): Promise<BigNumber>;

    peerContract(overrides?: CallOverrides): Promise<BigNumber>;

    peerMinExecutorFee(overrides?: CallOverrides): Promise<BigNumber>;

    peerMinRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

    sanctionsContract(overrides?: CallOverrides): Promise<BigNumber>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setBridgeProxyAddress(
      _bridgeProxyAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setMinBridgeFee(
      _minBridgeFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setMinExecutorFee(
      _minExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setPeerMinExecutorFee(
      _peerMinExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setPeerMinRollupFee(
      _peerMinRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setpeerContract(
      _peerChainId: BigNumberish,
      _peerContract: string,
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

    assetType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    associatedCommitmentPool(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bridgeProxyAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bridgeType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    deposit(
      _request: IMystikoBridge.DepositRequestStruct,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    hasher3(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isDepositsDisabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minAmount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minBridgeFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minExecutorFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    operator(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    peerChainId(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    peerContract(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    peerMinExecutorFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    peerMinRollupFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sanctionsContract(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setAssociatedCommitmentPool(
      _commitmentPoolAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setBridgeProxyAddress(
      _bridgeProxyAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setMinAmount(
      _minAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setMinBridgeFee(
      _minBridgeFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setMinExecutorFee(
      _minExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setPeerMinExecutorFee(
      _peerMinExecutorFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setPeerMinRollupFee(
      _peerMinRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setpeerContract(
      _peerChainId: BigNumberish,
      _peerContract: string,
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
