// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetPool.sol";

abstract contract MainAssetPool is AssetPool {
  function _processDepositTransfer(uint256 amount, uint256 bridgeFee) internal virtual override {
    require(msg.value == amount + bridgeFee, "insufficient token");
  }

  function _processExecutorFeeTransfer(uint256 amount) internal override {
    (bool success, ) = tx.origin.call{value: amount}("");
    require(success, "executor fee transfer failed");
  }

  function _processRollupFeeTransfer(uint256 amount) internal override {
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "rollup fee transfer failed");
  }

  function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
    require(msg.value == 0, "no mainnet token allowed");
    (bool success, ) = recipient.call{value: amount}("");
    require(success, "withdraw failed");
  }

  function assetType() public pure override returns (string memory) {
    return "main";
  }
}
