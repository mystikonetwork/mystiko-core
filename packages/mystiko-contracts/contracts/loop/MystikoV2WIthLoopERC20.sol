// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoV2WithLoop.sol";
import "../libs/asset/ERC20AssetPool.sol";

contract MystikoV2WithLoopERC20 is MystikoV2WithLoop, ERC20AssetPool {
  constructor(
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _withdrawVerifier,
    address _token
  )
    public
    MystikoV2WithLoop(_treeHeight, _rootHistoryLength, _minRollupFee, _withdrawVerifier)
    ERC20AssetPool(_token)
  {}
}
