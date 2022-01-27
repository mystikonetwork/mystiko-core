// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";

abstract contract MystikoWithLoop is Mystiko {
  constructor(
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public Mystiko(address(0), 0, _verifier, _hasher, _merkleTreeHeight) {}

  function _sendCrossChainTx(uint256 amount, bytes32 commitmentHash) internal override {
    uint32 leafIndex = _insert(commitmentHash);
    emit MerkleTreeInsert(commitmentHash, leafIndex, amount);
  }

  function bridgeType() public view override returns (string memory) {
    return "loop";
  }
}
