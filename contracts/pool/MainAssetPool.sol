// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./AssetPool.sol";

abstract contract MainAssetPool is AssetPool {
  function _processDepositTransfer(uint256 amount) internal override {
    require(msg.value == amount, "insufficient token");
  }

  function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
    require(msg.value == 0, "no mainnet token allowed");
    (bool success, ) = recipient.call{value: amount}("");
    require(success, "withdraw failed");
  }

  function assetType() public view override returns (string memory) {
    return "main";
  }
}
