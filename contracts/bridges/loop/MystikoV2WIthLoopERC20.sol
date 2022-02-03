// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoV2WithLoop.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoV2WithLoopERC20 is MystikoV2WithLoop, ERC20AssetPool {
  constructor(
    address _withdrawVerifier,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    address _token
  ) public MystikoV2WithLoop(_withdrawVerifier, _rootHistoryLength, _minRollupFee) ERC20AssetPool(_token) {}
}
