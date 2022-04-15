// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../base/MystikoV2Bridge.sol";
import "../base/CrossChainDataSerializable.sol";
import "./relay/interface/ICrossChainProxy.sol";
import "../../../interface/ICommitmentPool.sol";

abstract contract MystikoV2WithTBridge is MystikoV2Bridge, CrossChainDataSerializable {
  constructor(address _hasher3) MystikoV2Bridge(_hasher3) {}

  function _processDeposit(
    uint256 _amount,
    uint256 _commitment,
    uint256 _bridgeFee,
    uint256 _executorFee,
    uint256 _rollupFee,
    bytes memory _encryptedNote
  ) internal override {
    _processDepositTransfer(associatedCommitmentPool, _amount + _executorFee + _rollupFee, _bridgeFee);

    ICommitmentPool.CommitmentRequest memory cmRequest = ICommitmentPool.CommitmentRequest({
      amount: _amount,
      commitment: _commitment,
      executorFee: _executorFee,
      rollupFee: _rollupFee,
      encryptedNote: _encryptedNote
    });

    bytes memory cmRequestBytes = serializeTxData(cmRequest);
    ICrossChainProxy(bridgeProxyAddress).sendMessage{value: _bridgeFee}(
      peerContract,
      peerChainId,
      cmRequestBytes
    );
  }

  function bridgeType() public pure override returns (string memory) {
    return "tbridge";
  }
}
