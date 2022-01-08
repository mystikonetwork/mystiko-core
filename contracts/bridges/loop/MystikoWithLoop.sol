// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../Mystiko.sol";

contract MystikoWithLoop is Mystiko {

  constructor(
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight,
    address _operator
  ) Mystiko(_verifier, _token, _hasher, _merkleTreeHeight, _operator) {}

  function _processCrossChain(
    uint256 amount, bytes32 commitmentHash) internal override {
    uint32 leafIndex = _insert(commitmentHash);
    emit MerkleTreeInsert(commitmentHash, leafIndex, amount);
  }

}