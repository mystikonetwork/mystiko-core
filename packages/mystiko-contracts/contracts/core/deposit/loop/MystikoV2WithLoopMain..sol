// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../base/MystikoV2Loop.sol";
import "../../../libs/asset/MainAssetPool.sol";

contract MystikoV2WithLoopMain is MystikoV2Loop, MainAssetPool {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _hasher3
  ) MystikoV2Loop(_hasher3) {}
}
