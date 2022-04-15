// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CommitmentPool.sol";
import "../../libs/asset/MainAssetPool.sol";

contract CommitmentMainPool is CommitmentPool, MainAssetPool {
  constructor(uint32 _treeHeight, uint32 _rootHistoryLength)
    CommitmentPool(_treeHeight, _rootHistoryLength)
  {}
}
