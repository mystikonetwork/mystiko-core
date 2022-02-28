// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "../../Mystiko.sol";
import "../CrossChainDataSerializable.sol";
import "./relay/interface/IBillManager.sol";

abstract contract MystikoWithAnySwap is Mystiko, CrossChainDataSerializable {
  uint32 txId = 0;

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

  function _sendCrossChainTx(
    uint256 amount,
    bytes32 commitmentHash,
    uint256 bridgeFee
  ) internal override {
    CrossChainData memory txData = CrossChainData({amount: amount, commitmentHash: commitmentHash});
    bytes memory txDataBytes = serializeTxData(txData);
    IBillManager sender = IBillManager(relayProxyAddress);
    txId = txId++;
    address[] memory to = new address[](1);
    to[0] = peerContractAddress;
    bytes[] memory data = new bytes[](1);
    data[0] = txDataBytes;
    address[] memory fallbacks = new address[](1);
    fallbacks[0] = address(this);
    uint256[] memory nonces = new uint256[](1);
    nonces[0] = txId;
    sender.anyCall(to, data, fallbacks, nonces, peerChainId);
  }

  function anyCall(
    address from,
    address[] memory to,
    bytes[] memory data,
    address[] memory fallbacks,
    uint256[] memory nonces,
    uint256 fromChainID
  ) external onlyRelayProxyContract returns (bool) {
    to;
    fallbacks;
    nonces;
    CrossChainData memory txData = deserializeTxData(data[0]);
    require(from == peerContractAddress, "from proxy address not matched");
    require(fromChainID == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount should be greater than 0");
    require(!relayCommitments[txData.commitmentHash], "The commitment has been submitted");
    relayCommitments[txData.commitmentHash] = true;
    uint32 leafIndex = _insert(txData.commitmentHash);
    emit MerkleTreeInsert(txData.commitmentHash, leafIndex, txData.amount);
    return true;
  }

  function anyCallFallback(uint256 nonce) public {
    // todo fallback handler
  }

  function bridgeType() public view override returns (string memory) {
    return "anyswap";
  }
}
