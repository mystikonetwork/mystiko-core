// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./relay/interface/IMessageSenderApp.sol";
import "./relay/interface/IMessageReceiverApp.sol";
import "../base/CrossChainDataSerializable.sol";
import "../base/MystikoBridge.sol";

abstract contract MystikoWithCeler is MystikoBridge, IMessageReceiverApp {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _hasher3
  )
    MystikoBridge(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minBridgeFee,
      _minExecutorFee,
      _minRollupFee,
      _hasher3
    )
  {}

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 bridgeFee,
    uint256 executorFee,
    uint256 rollupFee
  ) internal override {
    CrossChainData memory txData = CrossChainData({
      amount: amount,
      commitment: commitment,
      executorFee: executorFee,
      rollupFee: rollupFee
    });
    bytes memory txDataBytes = serializeTxData(txData);
    IMessageSenderApp sender = IMessageSenderApp(relayProxyAddress);
    sender.sendMessage{value: bridgeFee}(peerContractAddress, uint256(peerChainId), txDataBytes);
  }

  //celer interface
  function executeMessage(
    address _sender,
    uint64 _srcChainId,
    bytes calldata _message,
    address _executor
  ) external payable override onlyRelayProxyContract returns (bool) {
    _syncDeposit(_srcChainId, _sender, _message);
    return true;
  }

  function bridgeType() public pure override returns (string memory) {
    return "celer";
  }
}
