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
    uint256 _minRollupFee,
    uint256 _minBridgeFee,
    address _withdrawVerifier
  )
    MystikoWithTBridge(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minRollupFee,
      _minBridgeFee,
      _withdrawVerifier
    )
  {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
