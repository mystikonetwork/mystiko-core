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

  function _processDepositTransfer(uint256 amount) internal override(AssetPool, ERC20AssetPool) {
    require(msg.value >= 1000, "insufficient token");
    asset.safeTransferFrom(msg.sender, address(this), amount);
  }

  function _sendCrossChainTx(uint256 amount, bytes32 commitmentHash) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    IMessageSenderApp sender = IMessageSenderApp(relayProxyAddress);
    sender.sendMessage{value: msg.value}(peerContractAddress, uint256(peerChainId), txDataBytes);
  }
}
