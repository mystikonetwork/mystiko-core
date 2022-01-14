// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "./AssetPool.sol";
import "../libs/erc20/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

abstract contract ERC20AssetPool is AssetPool {
    using SafeERC20 for IERC20Metadata;
    IERC20Metadata public token;

    constructor(address _token) public {
        token = IERC20Metadata(_token);
    }

    function _processDepositTransfer(uint256 amount) internal override {
        require(msg.value == 0, "no mainnet token allowed");
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function _processWithdrawTransfer(address recipient, uint256 amount) internal override {
        token.safeTransfer(recipient, amount);
    }

    function getToken() public view returns (address) {
        return address(token);
    }

    function getTokenName() public view returns (string memory) {
        return token.name();
    }

    function getTokenSymbol() public view returns (string memory) {
        return token.symbol();
    }

    function getTokenDecimals() public view returns (uint8) {
        return token.decimals();
    }
}
