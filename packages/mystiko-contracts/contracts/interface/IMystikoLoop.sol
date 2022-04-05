// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IVerifier.sol";

interface IMystikoLoop {
  struct DepositRequest {
    uint256 amount;
    uint256 commitment;
    uint256 hashK;
    uint128 randomS;
    bytes encryptedNote;
    uint256 rollupFee;
  }

  struct RollupRequest {
    IVerifier.Proof proof;
    uint32 rollupSize;
    uint256 newRoot;
    uint256 leafHash;
  }

  struct TransactRequest {
    IVerifier.Proof proof;
    uint256 rootHash;
    uint256[] serialNumbers;
    address publicRecipient;
    uint256 publicAmount;
    uint256 relayerFeeAmount;
    address relayerAddress;
    bytes20 sigPk;
    uint256[] sigHashes;
    uint256[] outCommitments;
    uint256[] outRollupFees;
    bytes[] outEncryptedNotes;
  }

  function deposit(DepositRequest memory request) external payable;

  function rollup(RollupRequest memory request) external;

  function transact(TransactRequest memory request, bytes memory signature) external payable;
}
