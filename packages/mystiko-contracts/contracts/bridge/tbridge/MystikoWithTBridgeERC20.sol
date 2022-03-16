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
    uint256 _minRollupFee,
    uint256 _minBridgeFee,
    address _withdrawVerifier,
    address _token
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
    ERC20AssetPool(_token)
  {}
}
