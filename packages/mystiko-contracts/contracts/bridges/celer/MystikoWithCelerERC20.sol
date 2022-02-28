// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithCeler.sol";
import "../../pool/ERC20AssetPool.sol";

contract MystikoWithCelerERC20 is MystikoWithCeler, ERC20AssetPool {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _token,
    address _hasher2,
    uint32 _merkleTreeHeight
  )
    public
    MystikoWithCeler(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _merkleTreeHeight)
    ERC20AssetPool(_token)
  {}

  function _processDepositTransfer(uint256 amount, uint256 bridgeFee)
    internal
    override(AssetPool, ERC20AssetPool)
  {
    require(msg.value == bridgeFee, "insufficient token");
    asset.safeTransferFrom(msg.sender, address(this), amount);
  }
}
