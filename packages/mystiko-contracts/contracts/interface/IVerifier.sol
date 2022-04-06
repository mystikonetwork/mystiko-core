// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
  struct G1Point {
    uint256 X;
    uint256 Y;
  }

  struct G2Point {
    uint256[2] X;
    uint256[2] Y;
  }

  struct Proof {
    G1Point a;
    G2Point b;
    G1Point c;
  }

  function verifyTx(Proof memory proof, uint256[] memory input) external returns (bool);
}

interface IWithdrawVerifier {
  function verifyProof(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[3] memory input
  ) external returns (bool);
}

interface IRollupVerifier {
  function verifyProof(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[4] memory input
  ) external returns (bool);
}
