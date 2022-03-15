// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoV2WithLoop.sol";
import "../libs/asset/MainAssetPool.sol";

contract MystikoV2WithLoopMain is MystikoV2WithLoop, MainAssetPool {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier
  ) public MystikoV2WithLoop(_treeHeight, _rootHistoryLength, _minRollupFee, _withdrawVerifier) {}
}
