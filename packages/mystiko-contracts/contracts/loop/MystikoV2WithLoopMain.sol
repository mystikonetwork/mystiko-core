// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoLoop.sol";
import "../libs/asset/MainAssetPool.sol";

contract MystikoV2WithLoopMain is MystikoLoop, MainAssetPool {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _hasher3
  ) MystikoLoop(_treeHeight, _rootHistoryLength, _minRollupFee, _hasher3) {}
}
