// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoWithTBridge.sol";
import "../../libs/asset/MainAssetPool.sol";

contract MystikoWithTBridgeMain is MystikoWithTBridge, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _withdrawVerifier
  )
    MystikoWithTBridge(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minBridgeFee,
      _minExecutorFee,
      _minRollupFee,
      _withdrawVerifier
    )
  {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
