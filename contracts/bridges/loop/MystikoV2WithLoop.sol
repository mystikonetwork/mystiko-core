// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../MystikoV2.sol";

abstract contract MystikoV2WithLoop is MystikoV2 {
  constructor(
    address _withdrawVerifier,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee
  ) public MystikoV2(_withdrawVerifier, _rootHistoryLength, _minRollupFee) {}

  function _processDeposit(
    uint256 commitmentHash,
    uint256 amount,
    uint256 rollupFee
  ) internal override {
    _enqueueDeposit(commitmentHash, amount, rollupFee);
  }

  function bridgeType() public view override returns (string memory) {
    return "loop";
  }
}
