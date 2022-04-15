/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from 'ethers';
import { FunctionFragment, Result } from '@ethersproject/abi';
import { Listener, Provider } from '@ethersproject/providers';
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from './common';

export declare namespace Transaction2x2Pairing {
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
}

export declare namespace Transaction2x2Verifier {
  export type ProofStruct = {
    a: Transaction2x2Pairing.G1PointStruct;
    b: Transaction2x2Pairing.G2PointStruct;
    c: Transaction2x2Pairing.G1PointStruct;
  };

  export type ProofStructOutput = [
    Transaction2x2Pairing.G1PointStructOutput,
    Transaction2x2Pairing.G2PointStructOutput,
    Transaction2x2Pairing.G1PointStructOutput,
  ] & {
    a: Transaction2x2Pairing.G1PointStructOutput;
    b: Transaction2x2Pairing.G2PointStructOutput;
    c: Transaction2x2Pairing.G1PointStructOutput;
  };
}

export interface Transaction2x2VerifierInterface extends utils.Interface {
  contractName: 'Transaction2x2Verifier';
  functions: {
    'verifyTx(((uint256,uint256),(uint256[2],uint256[2]),(uint256,uint256)),uint256[])': FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: 'verifyTx',
    values: [Transaction2x2Verifier.ProofStruct, BigNumberish[]],
  ): string;

  decodeFunctionResult(functionFragment: 'verifyTx', data: BytesLike): Result;

  events: {};
}

export interface Transaction2x2Verifier extends BaseContract {
  contractName: 'Transaction2x2Verifier';
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: Transaction2x2VerifierInterface;

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
    verifyTx(
      proof: Transaction2x2Verifier.ProofStruct,
      input: BigNumberish[],
      overrides?: CallOverrides,
    ): Promise<[boolean] & { r: boolean }>;
  };

  verifyTx(
    proof: Transaction2x2Verifier.ProofStruct,
    input: BigNumberish[],
    overrides?: CallOverrides,
  ): Promise<boolean>;

  callStatic: {
    verifyTx(
      proof: Transaction2x2Verifier.ProofStruct,
      input: BigNumberish[],
      overrides?: CallOverrides,
    ): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    verifyTx(
      proof: Transaction2x2Verifier.ProofStruct,
      input: BigNumberish[],
      overrides?: CallOverrides,
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    verifyTx(
      proof: Transaction2x2Verifier.ProofStruct,
      input: BigNumberish[],
      overrides?: CallOverrides,
    ): Promise<PopulatedTransaction>;
  };
}
