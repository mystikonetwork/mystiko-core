// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";
import "./relay/interface/IMessageSenderApp.sol";
import "./relay/interface/IMessageReceiverApp.sol";
import "../CrossChainDataSerializable.sol";

abstract contract MystikoWithCeler is Mystiko, IMessageReceiverApp, CrossChainDataSerializable {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher,
    uint32 _merkleTreeHeight
  ) public Mystiko(_relayProxyAddress, _peerChainId, _verifier, _hasher, _merkleTreeHeight) {}

  modifier onlyRelayProxyContract() {
    require(msg.sender == relayProxyAddress, "msgSender is not relay proxy");
    _;
  }

  function executeMessage(
    address _sender,
    uint64 _srcChainId,
    bytes calldata _message
  ) external payable override onlyRelayProxyContract returns (bool) {
    CrossChainData memory txData = deserializeTxData(_message);
    require(_sender == peerContractAddress, "from contract address not matched");
    require(_srcChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount shouuld be greater than 0");
    require(!relayCommitments[txData.commitmentHash], "The commitment has been submitted");
    relayCommitments[txData.commitmentHash] = true;
    uint32 leafIndex = _insert(txData.commitmentHash);
    emit MerkleTreeInsert(txData.commitmentHash, leafIndex, txData.amount);
    return true;
  }

  function _sendCrossChainTx(uint256 amount, bytes32 commitmentHash) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    IMessageSenderApp sender = IMessageSenderApp(relayProxyAddress);
    sender.sendMessage(peerContractAddress, peerChainId, txDataBytes, 0);
  }

  function bridgeType() public view override returns (string memory) {
    return "celer";
  }
}
