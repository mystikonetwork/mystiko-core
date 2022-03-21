// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoLoop.sol";
import "../libs/asset/ERC20AssetPool.sol";

contract MystikoV2WithLoopERC20 is MystikoLoop, ERC20AssetPool {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier,
    address _token
  ) MystikoLoop(_treeHeight, _rootHistoryLength, _minRollupFee, _withdrawVerifier) ERC20AssetPool(_token) {}
}
