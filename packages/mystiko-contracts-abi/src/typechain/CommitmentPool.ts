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

export declare namespace ICommitmentPool {
  export type CommitmentRequestStruct = {
    amount: BigNumberish;
    commitment: BigNumberish;
    executorFee: BigNumberish;
    rollupFee: BigNumberish;
    encryptedNote: BytesLike;
  };

  export type CommitmentRequestStructOutput = [BigNumber, BigNumber, BigNumber, BigNumber, string] & {
    amount: BigNumber;
    commitment: BigNumber;
    executorFee: BigNumber;
    rollupFee: BigNumber;
    encryptedNote: string;
  };

  export type RollupRequestStruct = {
    proof: IVerifier.ProofStruct;
    rollupSize: BigNumberish;
    newRoot: BigNumberish;
    leafHash: BigNumberish;
  };

  export type RollupRequestStructOutput = [IVerifier.ProofStructOutput, number, BigNumber, BigNumber] & {
    proof: IVerifier.ProofStructOutput;
    rollupSize: number;
    newRoot: BigNumber;
    leafHash: BigNumber;
  };

  export type TransactRequestStruct = {
    proof: IVerifier.ProofStruct;
    rootHash: BigNumberish;
    serialNumbers: BigNumberish[];
    sigHashes: BigNumberish[];
    sigPk: BytesLike;
    publicAmount: BigNumberish;
    relayerFeeAmount: BigNumberish;
    outCommitments: BigNumberish[];
    outRollupFees: BigNumberish[];
    publicRecipient: string;
    relayerAddress: string;
    outEncryptedNotes: BytesLike[];
  };

  export type TransactRequestStructOutput = [
    IVerifier.ProofStructOutput,
    BigNumber,
    BigNumber[],
    BigNumber[],
    string,
    BigNumber,
    BigNumber,
    BigNumber[],
    BigNumber[],
    string,
    string,
    string[],
  ] & {
    proof: IVerifier.ProofStructOutput;
    rootHash: BigNumber;
    serialNumbers: BigNumber[];
    sigHashes: BigNumber[];
    sigPk: string;
    publicAmount: BigNumber;
    relayerFeeAmount: BigNumber;
    outCommitments: BigNumber[];
    outRollupFees: BigNumber[];
    publicRecipient: string;
    relayerAddress: string;
    outEncryptedNotes: string[];
  };
}

export declare namespace IVerifier {
  export type G1PointStruct = { X: BigNumberish; Y: BigNumberish };

  export type G1PointStructOutput = [BigNumber, BigNumber] & {
    X: BigNumber;
    Y: BigNumber;
  };

  export type G2PointStruct = {
    X: [BigNumberish, BigNumberish];
    Y: [BigNumberish, BigNumberish];
  };

  export type G2PointStructOutput = [[BigNumber, BigNumber], [BigNumber, BigNumber]] & {
    X: [BigNumber, BigNumber];
    Y: [BigNumber, BigNumber];
  };

  export type ProofStruct = {
    a: IVerifier.G1PointStruct;
    b: IVerifier.G2PointStruct;
    c: IVerifier.G1PointStruct;
  };

  export type ProofStructOutput = [
    IVerifier.G1PointStructOutput,
    IVerifier.G2PointStructOutput,
    IVerifier.G1PointStructOutput,
  ] & {
    a: IVerifier.G1PointStructOutput;
    b: IVerifier.G2PointStructOutput;
    c: IVerifier.G1PointStructOutput;
  };
}

export interface CommitmentPoolInterface extends utils.Interface {
  contractName: 'CommitmentPool';
  functions: {
    'FIELD_SIZE()': FunctionFragment;
    'addEnqueueWhitelist(address)': FunctionFragment;
    'addRollupWhitelist(address)': FunctionFragment;
    'assetType()': FunctionFragment;
    'changeOperator(address)': FunctionFragment;
    'commitmentIncludedCount()': FunctionFragment;
    'commitmentQueue(uint256)': FunctionFragment;
    'commitmentQueueSize()': FunctionFragment;
    'currentRoot()': FunctionFragment;
    'currentRootIndex()': FunctionFragment;
    'disableRollupVerifier(uint32)': FunctionFragment;
    'disableTransactVerifier(uint32,uint32)': FunctionFragment;
    'enableRollupVerifier(uint32,address)': FunctionFragment;
    'enableTransactVerifier(uint32,uint32,address)': FunctionFragment;
    'enqueue((uint256,uint256,uint256,uint256,bytes),address)': FunctionFragment;
    'enqueueWhitelist(address)': FunctionFragment;
    'historicCommitments(uint256)': FunctionFragment;
    'isKnownRoot(uint256)': FunctionFragment;
    'isRollupWhitelistDisabled()': FunctionFragment;
    'isSanctionCheckDisabled()': FunctionFragment;
    'isVerifierUpdateDisabled()': FunctionFragment;
    'minRollupFee()': FunctionFragment;
    'operator()': FunctionFragment;
    'removeEnqueueWhitelist(address)': FunctionFragment;
    'removeRollupWhitelist(address)': FunctionFragment;
    'rollup((((uint256,uint256),(uint256[2],uint256[2]),(uint256,uint256)),uint32,uint256,uint256))': FunctionFragment;
    'rollupVerifiers(uint32)': FunctionFragment;
    'rollupWhitelist(address)': FunctionFragment;
    'rootHistory(uint32)': FunctionFragment;
    'rootHistoryLength()': FunctionFragment;
    'sanctionsContract()': FunctionFragment;
    'setMinRollupFee(uint256)': FunctionFragment;
    'spentSerialNumbers(uint256)': FunctionFragment;
    'toggleRollupWhitelist(bool)': FunctionFragment;
    'toggleSanctionCheck(bool)': FunctionFragment;
    'toggleVerifierUpdate(bool)': FunctionFragment;
    'transact((((uint256,uint256),(uint256[2],uint256[2]),(uint256,uint256)),uint256,uint256[],uint256[],bytes32,uint256,uint256,uint256[],uint256[],address,address,bytes[]),bytes)': FunctionFragment;
    'transactVerifiers(uint32,uint32)': FunctionFragment;
    'treeCapacity()': FunctionFragment;
    'updateSanctionContractAddress(address)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'FIELD_SIZE', values?: undefined): string;
  encodeFunctionData(functionFragment: 'addEnqueueWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'addRollupWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'assetType', values?: undefined): string;
  encodeFunctionData(functionFragment: 'changeOperator', values: [string]): string;
  encodeFunctionData(functionFragment: 'commitmentIncludedCount', values?: undefined): string;
  encodeFunctionData(functionFragment: 'commitmentQueue', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'commitmentQueueSize', values?: undefined): string;
  encodeFunctionData(functionFragment: 'currentRoot', values?: undefined): string;
  encodeFunctionData(functionFragment: 'currentRootIndex', values?: undefined): string;
  encodeFunctionData(functionFragment: 'disableRollupVerifier', values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: 'disableTransactVerifier',
    values: [BigNumberish, BigNumberish],
  ): string;
  encodeFunctionData(functionFragment: 'enableRollupVerifier', values: [BigNumberish, string]): string;
  encodeFunctionData(
    functionFragment: 'enableTransactVerifier',
    values: [BigNumberish, BigNumberish, string],
  ): string;
  encodeFunctionData(
    functionFragment: 'enqueue',
    values: [ICommitmentPool.CommitmentRequestStruct, string],
  ): string;
  encodeFunctionData(functionFragment: 'enqueueWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'historicCommitments', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'isKnownRoot', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'isRollupWhitelistDisabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'isSanctionCheckDisabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'isVerifierUpdateDisabled', values?: undefined): string;
  encodeFunctionData(functionFragment: 'minRollupFee', values?: undefined): string;
  encodeFunctionData(functionFragment: 'operator', values?: undefined): string;
  encodeFunctionData(functionFragment: 'removeEnqueueWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'removeRollupWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'rollup', values: [ICommitmentPool.RollupRequestStruct]): string;
  encodeFunctionData(functionFragment: 'rollupVerifiers', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'rollupWhitelist', values: [string]): string;
  encodeFunctionData(functionFragment: 'rootHistory', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'rootHistoryLength', values?: undefined): string;
  encodeFunctionData(functionFragment: 'sanctionsContract', values?: undefined): string;
  encodeFunctionData(functionFragment: 'setMinRollupFee', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'spentSerialNumbers', values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: 'toggleRollupWhitelist', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'toggleSanctionCheck', values: [boolean]): string;
  encodeFunctionData(functionFragment: 'toggleVerifierUpdate', values: [boolean]): string;
  encodeFunctionData(
    functionFragment: 'transact',
    values: [ICommitmentPool.TransactRequestStruct, BytesLike],
  ): string;
  encodeFunctionData(functionFragment: 'transactVerifiers', values: [BigNumberish, BigNumberish]): string;
  encodeFunctionData(functionFragment: 'treeCapacity', values?: undefined): string;
  encodeFunctionData(functionFragment: 'updateSanctionContractAddress', values: [string]): string;

  decodeFunctionResult(functionFragment: 'FIELD_SIZE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'addEnqueueWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'addRollupWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'assetType', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'changeOperator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'commitmentIncludedCount', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'commitmentQueue', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'commitmentQueueSize', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'currentRoot', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'currentRootIndex', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'disableRollupVerifier', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'disableTransactVerifier', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'enableRollupVerifier', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'enableTransactVerifier', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'enqueue', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'enqueueWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'historicCommitments', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isKnownRoot', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isRollupWhitelistDisabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isSanctionCheckDisabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'isVerifierUpdateDisabled', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'minRollupFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'operator', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'removeEnqueueWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'removeRollupWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'rollup', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'rollupVerifiers', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'rollupWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'rootHistory', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'rootHistoryLength', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'sanctionsContract', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'setMinRollupFee', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'spentSerialNumbers', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleRollupWhitelist', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleSanctionCheck', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'toggleVerifierUpdate', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'transact', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'transactVerifiers', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'treeCapacity', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'updateSanctionContractAddress', data: BytesLike): Result;

  events: {
    'CommitmentIncluded(uint256)': EventFragment;
    'CommitmentQueued(uint256,uint256,uint256,bytes)': EventFragment;
    'CommitmentSpent(uint256,uint256)': EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: 'CommitmentIncluded'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'CommitmentQueued'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'CommitmentSpent'): EventFragment;
}

export type CommitmentIncludedEvent = TypedEvent<[BigNumber], { commitment: BigNumber }>;

export type CommitmentIncludedEventFilter = TypedEventFilter<CommitmentIncludedEvent>;

export type CommitmentQueuedEvent = TypedEvent<
  [BigNumber, BigNumber, BigNumber, string],
  {
    commitment: BigNumber;
    rollupFee: BigNumber;
    leafIndex: BigNumber;
    encryptedNote: string;
  }
>;

export type CommitmentQueuedEventFilter = TypedEventFilter<CommitmentQueuedEvent>;

export type CommitmentSpentEvent = TypedEvent<
  [BigNumber, BigNumber],
  { rootHash: BigNumber; serialNumber: BigNumber }
>;

export type CommitmentSpentEventFilter = TypedEventFilter<CommitmentSpentEvent>;

export interface CommitmentPool extends BaseContract {
  contractName: 'CommitmentPool';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: CommitmentPoolInterface;

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

    addEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    addRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    assetType(overrides?: CallOverrides): Promise<[string]>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    commitmentIncludedCount(overrides?: CallOverrides): Promise<[BigNumber]>;

    commitmentQueue(
      arg0: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[BigNumber, BigNumber] & { commitment: BigNumber; rollupFee: BigNumber }>;

    commitmentQueueSize(overrides?: CallOverrides): Promise<[BigNumber]>;

    currentRoot(overrides?: CallOverrides): Promise<[BigNumber]>;

    currentRootIndex(overrides?: CallOverrides): Promise<[number]>;

    disableRollupVerifier(
      _rollupSize: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    disableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    enableRollupVerifier(
      _rollupSize: BigNumberish,
      _rollupVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    enableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      _transactVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    enqueue(
      _request: ICommitmentPool.CommitmentRequestStruct,
      _executor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    enqueueWhitelist(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    historicCommitments(arg0: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;

    isKnownRoot(root: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;

    isRollupWhitelistDisabled(overrides?: CallOverrides): Promise<[boolean]>;

    isSanctionCheckDisabled(overrides?: CallOverrides): Promise<[boolean]>;

    isVerifierUpdateDisabled(overrides?: CallOverrides): Promise<[boolean]>;

    minRollupFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    operator(overrides?: CallOverrides): Promise<[string]>;

    removeEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    removeRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    rollup(
      _request: ICommitmentPool.RollupRequestStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    rollupVerifiers(
      arg0: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

    rollupWhitelist(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    rootHistory(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;

    rootHistoryLength(overrides?: CallOverrides): Promise<[number]>;

    sanctionsContract(overrides?: CallOverrides): Promise<[string]>;

    setMinRollupFee(
      _minRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    spentSerialNumbers(arg0: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;

    toggleRollupWhitelist(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    toggleVerifierUpdate(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    transact(
      _request: ICommitmentPool.TransactRequestStruct,
      _signature: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    transactVerifiers(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

    treeCapacity(overrides?: CallOverrides): Promise<[BigNumber]>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;
  };

  FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

  addEnqueueWhitelist(
    _actor: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  addRollupWhitelist(
    _roller: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  assetType(overrides?: CallOverrides): Promise<string>;

  changeOperator(
    _newOperator: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  commitmentIncludedCount(overrides?: CallOverrides): Promise<BigNumber>;

  commitmentQueue(
    arg0: BigNumberish,
    overrides?: CallOverrides,
  ): Promise<[BigNumber, BigNumber] & { commitment: BigNumber; rollupFee: BigNumber }>;

  commitmentQueueSize(overrides?: CallOverrides): Promise<BigNumber>;

  currentRoot(overrides?: CallOverrides): Promise<BigNumber>;

  currentRootIndex(overrides?: CallOverrides): Promise<number>;

  disableRollupVerifier(
    _rollupSize: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  disableTransactVerifier(
    _numInputs: BigNumberish,
    _numOutputs: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  enableRollupVerifier(
    _rollupSize: BigNumberish,
    _rollupVerifier: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  enableTransactVerifier(
    _numInputs: BigNumberish,
    _numOutputs: BigNumberish,
    _transactVerifier: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  enqueue(
    _request: ICommitmentPool.CommitmentRequestStruct,
    _executor: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  enqueueWhitelist(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  historicCommitments(arg0: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

  isKnownRoot(root: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

  isRollupWhitelistDisabled(overrides?: CallOverrides): Promise<boolean>;

  isSanctionCheckDisabled(overrides?: CallOverrides): Promise<boolean>;

  isVerifierUpdateDisabled(overrides?: CallOverrides): Promise<boolean>;

  minRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

  operator(overrides?: CallOverrides): Promise<string>;

  removeEnqueueWhitelist(
    _actor: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  removeRollupWhitelist(
    _roller: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  rollup(
    _request: ICommitmentPool.RollupRequestStruct,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  rollupVerifiers(
    arg0: BigNumberish,
    overrides?: CallOverrides,
  ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

  rollupWhitelist(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  rootHistory(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

  rootHistoryLength(overrides?: CallOverrides): Promise<number>;

  sanctionsContract(overrides?: CallOverrides): Promise<string>;

  setMinRollupFee(
    _minRollupFee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  spentSerialNumbers(arg0: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

  toggleRollupWhitelist(
    _state: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  toggleSanctionCheck(
    _check: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  toggleVerifierUpdate(
    _state: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  transact(
    _request: ICommitmentPool.TransactRequestStruct,
    _signature: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  transactVerifiers(
    arg0: BigNumberish,
    arg1: BigNumberish,
    overrides?: CallOverrides,
  ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

  treeCapacity(overrides?: CallOverrides): Promise<BigNumber>;

  updateSanctionContractAddress(
    _sanction: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  callStatic: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    addEnqueueWhitelist(_actor: string, overrides?: CallOverrides): Promise<void>;

    addRollupWhitelist(_roller: string, overrides?: CallOverrides): Promise<void>;

    assetType(overrides?: CallOverrides): Promise<string>;

    changeOperator(_newOperator: string, overrides?: CallOverrides): Promise<void>;

    commitmentIncludedCount(overrides?: CallOverrides): Promise<BigNumber>;

    commitmentQueue(
      arg0: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[BigNumber, BigNumber] & { commitment: BigNumber; rollupFee: BigNumber }>;

    commitmentQueueSize(overrides?: CallOverrides): Promise<BigNumber>;

    currentRoot(overrides?: CallOverrides): Promise<BigNumber>;

    currentRootIndex(overrides?: CallOverrides): Promise<number>;

    disableRollupVerifier(_rollupSize: BigNumberish, overrides?: CallOverrides): Promise<void>;

    disableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<void>;

    enableRollupVerifier(
      _rollupSize: BigNumberish,
      _rollupVerifier: string,
      overrides?: CallOverrides,
    ): Promise<void>;

    enableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      _transactVerifier: string,
      overrides?: CallOverrides,
    ): Promise<void>;

    enqueue(
      _request: ICommitmentPool.CommitmentRequestStruct,
      _executor: string,
      overrides?: CallOverrides,
    ): Promise<boolean>;

    enqueueWhitelist(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    historicCommitments(arg0: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    isKnownRoot(root: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    isRollupWhitelistDisabled(overrides?: CallOverrides): Promise<boolean>;

    isSanctionCheckDisabled(overrides?: CallOverrides): Promise<boolean>;

    isVerifierUpdateDisabled(overrides?: CallOverrides): Promise<boolean>;

    minRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<string>;

    removeEnqueueWhitelist(_actor: string, overrides?: CallOverrides): Promise<void>;

    removeRollupWhitelist(_roller: string, overrides?: CallOverrides): Promise<void>;

    rollup(_request: ICommitmentPool.RollupRequestStruct, overrides?: CallOverrides): Promise<void>;

    rollupVerifiers(
      arg0: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

    rollupWhitelist(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    rootHistory(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    rootHistoryLength(overrides?: CallOverrides): Promise<number>;

    sanctionsContract(overrides?: CallOverrides): Promise<string>;

    setMinRollupFee(_minRollupFee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    spentSerialNumbers(arg0: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    toggleRollupWhitelist(_state: boolean, overrides?: CallOverrides): Promise<void>;

    toggleSanctionCheck(_check: boolean, overrides?: CallOverrides): Promise<void>;

    toggleVerifierUpdate(_state: boolean, overrides?: CallOverrides): Promise<void>;

    transact(
      _request: ICommitmentPool.TransactRequestStruct,
      _signature: BytesLike,
      overrides?: CallOverrides,
    ): Promise<void>;

    transactVerifiers(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, boolean] & { verifier: string; enabled: boolean }>;

    treeCapacity(overrides?: CallOverrides): Promise<BigNumber>;

    updateSanctionContractAddress(_sanction: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    'CommitmentIncluded(uint256)'(commitment?: BigNumberish | null): CommitmentIncludedEventFilter;
    CommitmentIncluded(commitment?: BigNumberish | null): CommitmentIncludedEventFilter;

    'CommitmentQueued(uint256,uint256,uint256,bytes)'(
      commitment?: BigNumberish | null,
      rollupFee?: null,
      leafIndex?: null,
      encryptedNote?: null,
    ): CommitmentQueuedEventFilter;
    CommitmentQueued(
      commitment?: BigNumberish | null,
      rollupFee?: null,
      leafIndex?: null,
      encryptedNote?: null,
    ): CommitmentQueuedEventFilter;

    'CommitmentSpent(uint256,uint256)'(
      rootHash?: BigNumberish | null,
      serialNumber?: BigNumberish | null,
    ): CommitmentSpentEventFilter;
    CommitmentSpent(
      rootHash?: BigNumberish | null,
      serialNumber?: BigNumberish | null,
    ): CommitmentSpentEventFilter;
  };

  estimateGas: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<BigNumber>;

    addEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    addRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    assetType(overrides?: CallOverrides): Promise<BigNumber>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    commitmentIncludedCount(overrides?: CallOverrides): Promise<BigNumber>;

    commitmentQueue(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    commitmentQueueSize(overrides?: CallOverrides): Promise<BigNumber>;

    currentRoot(overrides?: CallOverrides): Promise<BigNumber>;

    currentRootIndex(overrides?: CallOverrides): Promise<BigNumber>;

    disableRollupVerifier(
      _rollupSize: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    disableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    enableRollupVerifier(
      _rollupSize: BigNumberish,
      _rollupVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    enableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      _transactVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    enqueue(
      _request: ICommitmentPool.CommitmentRequestStruct,
      _executor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    enqueueWhitelist(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    historicCommitments(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    isKnownRoot(root: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    isRollupWhitelistDisabled(overrides?: CallOverrides): Promise<BigNumber>;

    isSanctionCheckDisabled(overrides?: CallOverrides): Promise<BigNumber>;

    isVerifierUpdateDisabled(overrides?: CallOverrides): Promise<BigNumber>;

    minRollupFee(overrides?: CallOverrides): Promise<BigNumber>;

    operator(overrides?: CallOverrides): Promise<BigNumber>;

    removeEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    removeRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    rollup(
      _request: ICommitmentPool.RollupRequestStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    rollupVerifiers(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    rollupWhitelist(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    rootHistory(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    rootHistoryLength(overrides?: CallOverrides): Promise<BigNumber>;

    sanctionsContract(overrides?: CallOverrides): Promise<BigNumber>;

    setMinRollupFee(
      _minRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    spentSerialNumbers(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    toggleRollupWhitelist(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    toggleVerifierUpdate(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    transact(
      _request: ICommitmentPool.TransactRequestStruct,
      _signature: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    transactVerifiers(arg0: BigNumberish, arg1: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    treeCapacity(overrides?: CallOverrides): Promise<BigNumber>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    FIELD_SIZE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    addRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    assetType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    changeOperator(
      _newOperator: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    commitmentIncludedCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    commitmentQueue(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    commitmentQueueSize(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    currentRoot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    currentRootIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    disableRollupVerifier(
      _rollupSize: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    disableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    enableRollupVerifier(
      _rollupSize: BigNumberish,
      _rollupVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    enableTransactVerifier(
      _numInputs: BigNumberish,
      _numOutputs: BigNumberish,
      _transactVerifier: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    enqueue(
      _request: ICommitmentPool.CommitmentRequestStruct,
      _executor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    enqueueWhitelist(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    historicCommitments(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isKnownRoot(root: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isRollupWhitelistDisabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isSanctionCheckDisabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isVerifierUpdateDisabled(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    minRollupFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    operator(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeEnqueueWhitelist(
      _actor: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    removeRollupWhitelist(
      _roller: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    rollup(
      _request: ICommitmentPool.RollupRequestStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    rollupVerifiers(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    rollupWhitelist(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    rootHistory(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    rootHistoryLength(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sanctionsContract(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setMinRollupFee(
      _minRollupFee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    spentSerialNumbers(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    toggleRollupWhitelist(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    toggleSanctionCheck(
      _check: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    toggleVerifierUpdate(
      _state: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    transact(
      _request: ICommitmentPool.TransactRequestStruct,
      _signature: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    transactVerifiers(
      arg0: BigNumberish,
      arg1: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<PopulatedTransaction>;

    treeCapacity(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    updateSanctionContractAddress(
      _sanction: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;
  };
}
