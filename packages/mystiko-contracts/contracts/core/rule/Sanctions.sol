// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface SanctionsList {
  function isSanctioned(address addr) external view returns (bool);
}

abstract contract Sanctions {
  address public sanctionsContract = 0x40C57923924B5c5c5455c48D93317139ADDaC8fb;
  bool enableSanctionCheck = true;

  function isToSanctioned(address _to) internal returns (bool) {
    if (!enableSanctionCheck) {
      return true;
    }

    SanctionsList sanctionsList = SanctionsList(sanctionsContract);
    return sanctionsList.isSanctioned(_to);
  }
}
