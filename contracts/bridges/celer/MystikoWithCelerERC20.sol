// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithCeler.sol";
import "../../pool/ERC20AssetPool.sol";
import "./MystikoWithCeler.sol";

contract MystikoWithCelerERC20 is MystikoWithCeler, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithCeler(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight)
    ERC20AssetPool(_token)
  {}
}
