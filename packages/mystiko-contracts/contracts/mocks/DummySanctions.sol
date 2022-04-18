// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DummySanctionsList {
  address public sanction = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

  function setSanction(address addr) external {
    sanction = addr;
  }

  function isSanctioned(address addr) external view returns (bool) {
    if (addr == sanction) {
      return true;
    } else {
      return false;
    }
  }
}
