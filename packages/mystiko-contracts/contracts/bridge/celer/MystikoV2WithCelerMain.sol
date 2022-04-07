// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoV2WithCeler.sol";
import "../../libs/asset/MainAssetPool.sol";

contract MystikoV2WithCelerMain is MystikoV2WithCeler, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _hasher3
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
  {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
