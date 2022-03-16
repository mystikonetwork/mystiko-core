// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./relay/interface/IMessageSenderApp.sol";
import "./relay/interface/IMessageReceiverApp.sol";
import "../CrossChainDataSerializable.sol";
import "../MystikoBridge.sol";

abstract contract MystikoWithCeler is MystikoBridge, IMessageReceiverApp, CrossChainDataSerializable {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minRollupFee,
    uint256 _minBridgeFee,
    address _withdrawVerifier
  )
    MystikoBridge(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minRollupFee,
      _minBridgeFee,
      _withdrawVerifier
    )
  {}

  //celer interface
  function executeMessage(
    address _sender,
    uint64 _srcChainId,
    bytes calldata _message
  ) external payable override onlyRelayProxyContract returns (bool) {
    CrossChainData memory txData = deserializeTxData(_message);
    require(_sender == peerContractAddress, "from contract address not matched");
    require(_srcChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount shouuld be greater than 0");
    require(!relayCommitments[txData.commitment], "The commitment has been submitted");
    relayCommitments[txData.commitment] = true;

    //todo how to process rollup fee??
    _enqueueDeposit(txData.commitment, txData.amount, 0);
    return true;
  }

  function bridgeType() public pure override returns (string memory) {
    return "celer";
  }
}
