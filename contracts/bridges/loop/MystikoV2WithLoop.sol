// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../MystikoV2.sol";

abstract contract MystikoV2WithLoop is MystikoV2 {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier
  ) public MystikoV2(_treeHeight, _rootHistoryLength, _minRollupFee, _withdrawVerifier) {}

  function _processDeposit(
    uint256 amount,
    uint256 commitmentHash,
    uint256 rollupFee
  ) internal override {
    _enqueueDeposit(commitmentHash, amount, rollupFee);
  }

  function bridgeType() public view override returns (string memory) {
    return "loop";
  }
}
