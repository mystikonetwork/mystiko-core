// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./AssetPool.sol";
import "../libs/erc20/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

abstract contract ERC20AssetPool is AssetPool {
  using SafeERC20 for IERC20Metadata;
  IERC20Metadata public asset;

  constructor(address _assetAddress) public {
    asset = IERC20Metadata(_assetAddress);
  }

  function _processDepositTransfer(uint256 amount, uint256 bridgeFee) internal virtual override {
    require(msg.value == 0, "no mainnet token allowed");
    asset.safeTransferFrom(msg.sender, address(this), amount);
  }

  function _processRollupFeeTransfer(uint256 amount) internal override {
    asset.safeTransfer(msg.sender, amount);
  }

  function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
    asset.safeTransfer(recipient, amount);
  }

  function assetType() public view override returns (string memory) {
    return "erc20";
  }

  function assetName() public view returns (string memory) {
    return asset.name();
  }

  function assetSymbol() public view returns (string memory) {
    return asset.symbol();
  }

  function assetDecimals() public view returns (uint8) {
    return asset.decimals();
  }
}
