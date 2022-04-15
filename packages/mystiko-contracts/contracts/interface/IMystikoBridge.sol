// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICommitmentPool.sol";

interface IMystikoBridge {
  struct DepositRequest {
    uint256 amount;
    uint256 commitment;
    uint256 hashK;
    uint128 randomS;
    bytes encryptedNote;
    uint256 bridgeFee;
    uint256 executorFee;
    uint256 rollupFee;
  }

  function deposit(DepositRequest memory _request) external payable;

  function bridgeCommitment(
    uint256 _fromChainId,
    address _fromContract,
    ICommitmentPool.CommitmentRequest memory _request
  ) external returns (bool);
}
