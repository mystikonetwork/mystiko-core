// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
  string public constant NAME = "Mystiko Test Token";
  string public constant SYMBOL = "MTT";

  constructor () public ERC20(NAME, SYMBOL) {
    _mint(msg.sender, 1000000000 * (10 ** uint256(18)));
  }
}