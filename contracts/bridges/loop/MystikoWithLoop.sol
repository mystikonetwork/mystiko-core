// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";

contract MystikoWithLoop is Mystiko {

  constructor(
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public Mystiko(_verifier, _token, _hasher, _merkleTreeHeight, ProtocolType.SAME_CHAIN) {}

  function _processCrossChain(
    uint256 amount, bytes32 commitmentHash) internal override {
    uint32 leafIndex = _insert(commitmentHash);
    emit MerkleTreeInsert(commitmentHash, leafIndex, amount);
  }

}