// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoV2WithLoop.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoV2WithLoopMain is MystikoV2WithLoop, MainAssetPool {
  constructor(
    address _commitmentHasher,
    address _withdrawVerifier,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee
  ) public MystikoV2WithLoop(_commitmentHasher, _withdrawVerifier, _rootHistoryLength, _minRollupFee) {}
}
