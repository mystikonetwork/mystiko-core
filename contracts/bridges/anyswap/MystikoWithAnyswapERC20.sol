// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "./MystikoWithAnyswap.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithAnyswapERC20 is MystikoWithAnySwap, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithAnySwap(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight)
    ERC20AssetPool(_token)
  {}
}
