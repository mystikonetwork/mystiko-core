// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MystikoWithCeler.sol";
import "../../libs/asset/MainAssetPool.sol";

contract MystikoWithCelerMain is MystikoWithCeler, MainAssetPool {
  event Received(address, uint256);

  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    uint256 _minBridgeFee,
    address _withdrawVerifier
  )
    MystikoWithCeler(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minRollupFee,
      _minBridgeFee,
      _withdrawVerifier
    )
  {}

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 rollupFee
  ) internal override {
    //todo how to process rollup fee??
    CrossChainData memory txData = CrossChainData({amount: amount, commitment: commitment});
    bytes memory txDataBytes = serializeTxData(txData);
    IMessageSenderApp sender = IMessageSenderApp(relayProxyAddress);
    sender.sendMessage{value: (msg.value - amount)}(peerContractAddress, uint256(peerChainId), txDataBytes);
  }
}
