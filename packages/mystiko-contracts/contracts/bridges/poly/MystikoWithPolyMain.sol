// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithPoly.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithPolyMain is MystikoWithPoly, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher2,
    uint32 _merkleTreeHeight
  ) public MystikoWithPoly(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _merkleTreeHeight) {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
