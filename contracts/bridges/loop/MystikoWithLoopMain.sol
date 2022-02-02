// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithLoop.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithLoopMain is MystikoWithLoop, MainAssetPool {
  constructor(
    address _verifier,
    address _hasher2,
    address _hasher3,
    uint32 _merkleTreeHeight
  ) public MystikoWithLoop(_verifier, _hasher2, _hasher3, _merkleTreeHeight) {}
}
