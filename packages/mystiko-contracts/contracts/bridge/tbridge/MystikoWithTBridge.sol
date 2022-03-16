// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../MystikoBridge.sol";
import "../CrossChainDataSerializable.sol";
import "./relay/interface/ICrossChainProxy.sol";

abstract contract MystikoWithTBridge is MystikoBridge, CrossChainDataSerializable {
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

  function _processDeposit(
    uint256 amount,
    uint256 commitment,
    uint256 rollupFee
  ) internal override {
    //todo how to process rollup fee??
    CrossChainData memory txData = CrossChainData({amount: amount, commitment: commitment});
    bytes memory txDataBytes = serializeTxData(txData);
    ICrossChainProxy relayProxy = ICrossChainProxy(relayProxyAddress);
    relayProxy.sendMessage(peerChainId, peerContractAddress, txDataBytes);
  }

  //tbridge interface
  function syncDepositTx(
    bytes memory txDataBytes,
    bytes memory fromContractAddr,
    uint64 fromChainId
  ) external onlyRelayProxyContract returns (bool) {
    CrossChainData memory txData = deserializeTxData(txDataBytes);
    require(fromContractAddr.length != 0, "from proxy contract address cannot be empty");
    require(Utils.bytesToAddress(fromContractAddr) == peerContractAddress, "from proxy address not matched");
    require(fromChainId == peerChainId, "from chain id not matched");
    require(txData.amount > 0, "amount should be greater than 0");
    require(!relayCommitments[txData.commitment], "The commitment has been submitted");
    relayCommitments[txData.commitment] = true;

    //todo how to process rollup fee??
    _enqueueDeposit(txData.commitment, txData.amount, 0);

    return true;
  }

  function bridgeType() public pure override returns (string memory) {
    return "tbridge";
  }
}
