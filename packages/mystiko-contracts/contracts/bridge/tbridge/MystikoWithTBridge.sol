// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../base/MystikoBridge.sol";
import "../base/CrossChainDataSerializable.sol";
import "./relay/interface/ICrossChainProxy.sol";

abstract contract MystikoWithTBridge is MystikoBridge {
  constructor(
    address _relayProxyAddress,
    uint64 _peerChainId,
    uint32 _treeHeight,
    uint32 _rootHistoryLength,
    uint256 _minBridgeFee,
    uint256 _minExecutorFee,
    uint256 _minRollupFee,
    address _withdrawVerifier
  )
    MystikoBridge(
      _relayProxyAddress,
      _peerChainId,
      _treeHeight,
      _rootHistoryLength,
      _minBridgeFee,
      _minExecutorFee,
      _minRollupFee,
      _withdrawVerifier
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
    ICrossChainProxy relayProxy = ICrossChainProxy(relayProxyAddress);
    relayProxy.sendMessage{value: bridgeFee}(peerChainId, peerContractAddress, txDataBytes);
  }

  //tbridge interface
  function syncDepositTx(
    uint64 fromChainId,
    address fromContractAddr,
    bytes memory txDataBytes
  ) external onlyRelayProxyContract returns (bool) {
    _syncDeposit(fromChainId, fromContractAddr, txDataBytes);
    return true;
  }

  function bridgeType() public pure override returns (string memory) {
    return "tbridge";
  }
}
