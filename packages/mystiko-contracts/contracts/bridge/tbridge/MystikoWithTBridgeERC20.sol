// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoWithTBridge.sol";
import "../../libs/asset/ERC20AssetPool.sol";

contract MystikoWithTBridgeERC20 is MystikoWithTBridge, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _withdrawVerifier,
    address _token
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
    ERC20AssetPool(_token)
  {}
}
