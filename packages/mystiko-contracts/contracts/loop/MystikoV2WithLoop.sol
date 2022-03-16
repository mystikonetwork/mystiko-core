// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoLoop.sol";

abstract contract MystikoV2WithLoop is MystikoLoop {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier
  ) MystikoLoop(_treeHeight, _rootHistoryLength, _minRollupFee, _withdrawVerifier) {}

  function _processDeposit(
    uint256 amount,
    uint256 commitmentHash,
    uint256 rollupFee
  ) internal override {
    _enqueueDeposit(commitmentHash, amount, rollupFee);
  }

  function bridgeType() public pure override returns (string memory) {
    return "loop";
  }
}
