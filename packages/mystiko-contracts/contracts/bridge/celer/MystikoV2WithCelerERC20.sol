// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoV2WithCeler.sol";
import "../../libs/asset/ERC20AssetPool.sol";

contract MystikoV2WithCelerERC20 is MystikoV2WithCeler, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _hasher3,
    address _token
  )
    MystikoV2WithCeler(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minBridgeFee,
      _minExecutorFee,
      _minRollupFee,
      _hasher3
    )
    ERC20AssetPool(_token)
  {}
}
