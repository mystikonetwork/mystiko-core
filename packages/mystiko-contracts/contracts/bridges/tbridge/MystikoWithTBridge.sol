// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "../../Mystiko.sol";
import "./relay/interface/ICrossChainProxy.sol";
import "../CrossChainDataSerializable.sol";

abstract contract MystikoWithTBridge is Mystiko, CrossChainDataSerializable {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    address _verifier,
    address _hasher2,
    uint32 _merkleTreeHeight
  ) public Mystiko(_relayProxyAddress, _peerChainId, _verifier, _hasher2, _merkleTreeHeight) {}

  modifier onlyRelayProxyContract() {
    require(msg.sender == relayProxyAddress, "msg sender is not relay proxy");
    _;
  }

  function syncTx(
    bytes memory txDataBytes,
    bytes memory fromContractAddr,
    uint64 fromChainId
  ) public onlyRelayProxyContract returns (bool) {
    CrossChainData memory txData = deserializeTxData(txDataBytes);
    require(fromContractAddr.length != 0, "from proxy contract address cannot be empty");
    require(Utils.bytesToAddress(fromContractAddr) == peerContractAddress, "from proxy address not matched");
    require(fromChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount shouuld be greater than 0");
    require(!relayCommitments[txData.commitmentHash], "The commitment has been submitted");
    relayCommitments[txData.commitmentHash] = true;
    uint32 leafIndex = _insert(txData.commitmentHash);
    emit MerkleTreeInsert(txData.commitmentHash, leafIndex, txData.amount);
    return true;
  }

  function _sendCrossChainTx(
    uint256 amount,
    bytes32 commitmentHash,
    uint256 bridgeFee
  ) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    ICrossChainProxy relayProxy = ICrossChainProxy(relayProxyAddress);
    relayProxy.sendMessage(peerChainId, peerContractAddress, txDataBytes);
  }

  function bridgeType() public view override returns (string memory) {
    return "tbridge";
  }
}
