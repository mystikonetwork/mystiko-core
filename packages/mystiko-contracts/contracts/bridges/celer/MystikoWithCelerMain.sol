// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./MystikoWithCeler.sol";
import "../../pool/MainAssetPool.sol";

contract MystikoWithCelerMain is MystikoWithCeler, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher2,
    uint32 _merkleTreeHeight
  ) public MystikoWithCeler(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _merkleTreeHeight) {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  function _processDepositTransfer(uint256 amount) internal override(AssetPool, MainAssetPool) {
    require(msg.value >= amount + 1000, "insufficient token");
  }

  function _sendCrossChainTx(uint256 amount, bytes32 commitmentHash) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    IMessageSenderApp sender = IMessageSenderApp(relayProxyAddress);
    sender.sendMessage{value: (msg.value - amount)}(peerContractAddress, uint256(peerChainId), txDataBytes);
  }
}
