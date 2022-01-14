// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";

abstract contract MystikoWithLoop is Mystiko {

  constructor(
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight,
    TokenType _tokenType
  ) public Mystiko(_verifier, _hasher, _merkleTreeHeight, ProtocolType.SAME_CHAIN, _tokenType) {}

  function _processCrossChain(
    uint256 amount, bytes32 commitmentHash) internal override {
    uint32 leafIndex = _insert(commitmentHash);
    emit MerkleTreeInsert(commitmentHash, leafIndex, amount);
  }

}