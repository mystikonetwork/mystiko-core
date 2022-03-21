// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMystikoBridge {
  function deposit(
    uint256 amount,
    uint256 commitment,
    uint256 hashK,
    uint128 randomS,
    bytes memory encryptedNote,
    uint256 bridgeFee,
    uint256 executorFee,
    uint256 rollupFee
  ) external payable;

  function rollup(
    uint256[2] memory proofA,
    uint256[2][2] memory proofB,
    uint256[2] memory proofC,
    uint32 rollupSize,
    uint256 newRoot,
    uint256 leafHash
  ) external;

  function withdraw(
    uint256[2] memory proofA,
    uint256[2][2] memory proofB,
    uint256[2] memory proofC,
    uint256 rootHash,
    uint256 serialNumber,
    uint256 amount,
    address recipient,
    uint256 relayerFee,
    address relayerAddress
  ) external payable;
}
