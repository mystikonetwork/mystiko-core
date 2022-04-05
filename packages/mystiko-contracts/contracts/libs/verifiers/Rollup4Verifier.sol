// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Rollup4Pairing {
  struct G1Point {
    uint256 X;
    uint256 Y;
  }
  // Encoding of field elements is: X[0] * z + X[1]
  struct G2Point {
    uint256[2] X;
    uint256[2] Y;
  }

  /// @return the generator of G1
  function P1() internal pure returns (G1Point memory) {
    return G1Point(1, 2);
  }

  /// @return the generator of G2
  function P2() internal pure returns (G2Point memory) {
    return
      G2Point(
        [
          10857046999023057135944570762232829481370756359578518086990519993285655852781,
          11559732032986387107991004021392285783925812861821192530917403151452391805634
        ],
        [
          8495653923123431417604973247489272438418190587263600148770280649306958101930,
          4082367875863433681332203403145435568316851327593401208105741076214120093531
        ]
      );
  }

  /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
  function negate(G1Point memory p) internal pure returns (G1Point memory) {
    // The prime q in the base field F_q for G1
    uint256 q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
    return G1Point(p.X, q - (p.Y % q));
  }

  /// @return r the sum of two points of G1
  function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
    uint256[4] memory input;
    input[0] = p1.X;
    input[1] = p1.Y;
    input[2] = p2.X;
    input[3] = p2.Y;
    bool success;
    assembly {
      success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
      // Use "invalid" to make gas estimation work
      switch success
      case 0 {
        invalid()
      }
    }
    require(success);
  }

  /// @return r the product of a point on G1 and a scalar, i.e.
  /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
  function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
    uint256[3] memory input;
    input[0] = p.X;
    input[1] = p.Y;
    input[2] = s;
    bool success;
    assembly {
      success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
      // Use "invalid" to make gas estimation work
      switch success
      case 0 {
        invalid()
      }
    }
    require(success);
  }

  /// @return the result of computing the pairing check
  /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
  /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
  /// return true.
  function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
    require(p1.length == p2.length);
    uint256 elements = p1.length;
    uint256 inputSize = elements * 6;
    uint256[] memory input = new uint256[](inputSize);
    for (uint256 i = 0; i < elements; i++) {
      input[i * 6 + 0] = p1[i].X;
      input[i * 6 + 1] = p1[i].Y;
      input[i * 6 + 2] = p2[i].X[1];
      input[i * 6 + 3] = p2[i].X[0];
      input[i * 6 + 4] = p2[i].Y[1];
      input[i * 6 + 5] = p2[i].Y[0];
    }
    uint256[1] memory out;
    bool success;
    assembly {
      success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
      // Use "invalid" to make gas estimation work
      switch success
      case 0 {
        invalid()
      }
    }
    require(success);
    return out[0] != 0;
  }

  /// Convenience method for a pairing check for two pairs.
  function pairingProd2(
    G1Point memory a1,
    G2Point memory a2,
    G1Point memory b1,
    G2Point memory b2
  ) internal view returns (bool) {
    G1Point[] memory p1 = new G1Point[](2);
    G2Point[] memory p2 = new G2Point[](2);
    p1[0] = a1;
    p1[1] = b1;
    p2[0] = a2;
    p2[1] = b2;
    return pairing(p1, p2);
  }

  /// Convenience method for a pairing check for three pairs.
  function pairingProd3(
    G1Point memory a1,
    G2Point memory a2,
    G1Point memory b1,
    G2Point memory b2,
    G1Point memory c1,
    G2Point memory c2
  ) internal view returns (bool) {
    G1Point[] memory p1 = new G1Point[](3);
    G2Point[] memory p2 = new G2Point[](3);
    p1[0] = a1;
    p1[1] = b1;
    p1[2] = c1;
    p2[0] = a2;
    p2[1] = b2;
    p2[2] = c2;
    return pairing(p1, p2);
  }

  /// Convenience method for a pairing check for four pairs.
  function pairingProd4(
    G1Point memory a1,
    G2Point memory a2,
    G1Point memory b1,
    G2Point memory b2,
    G1Point memory c1,
    G2Point memory c2,
    G1Point memory d1,
    G2Point memory d2
  ) internal view returns (bool) {
    G1Point[] memory p1 = new G1Point[](4);
    G2Point[] memory p2 = new G2Point[](4);
    p1[0] = a1;
    p1[1] = b1;
    p1[2] = c1;
    p1[3] = d1;
    p2[0] = a2;
    p2[1] = b2;
    p2[2] = c2;
    p2[3] = d2;
    return pairing(p1, p2);
  }
}

contract Rollup4Verifier {
  using Rollup4Pairing for *;
  struct VerifyingKey {
    Rollup4Pairing.G1Point alpha;
    Rollup4Pairing.G2Point beta;
    Rollup4Pairing.G2Point gamma;
    Rollup4Pairing.G2Point delta;
    Rollup4Pairing.G1Point[] gamma_abc;
  }
  struct Proof {
    Rollup4Pairing.G1Point a;
    Rollup4Pairing.G2Point b;
    Rollup4Pairing.G1Point c;
  }

  function verifyingKey() internal pure returns (VerifyingKey memory vk) {
    vk.alpha = Rollup4Pairing.G1Point(
      uint256(0x1289f795b184be735efa0c35c6ba2a46703759ac3146b7ebe5314f2a43e57acc),
      uint256(0x23e6eda422ecbdf54579d5d8620dcc5512505ad174a594906c996af6d013c50c)
    );
    vk.beta = Rollup4Pairing.G2Point(
      [
        uint256(0x06f62f1eb5ca2cb706027ac6425bc3ea1f28cb83e965192b4ed520596c446b8c),
        uint256(0x09c83e652d63fe8e7bfdaa77a96fc9813c9cf52af7fb60f437d8ecb96ab4ac3f)
      ],
      [
        uint256(0x15a3097ec8360bad28968edceb057a3bbb85509d48d7148d0e019ccd3f147110),
        uint256(0x14d78cbe00761f4a487040a79376b0c12f87914a01bc159fcabb01918e130d06)
      ]
    );
    vk.gamma = Rollup4Pairing.G2Point(
      [
        uint256(0x1b7b87e0751adfc412d395b518ff9d8c828491a1ccc5e752a78b7b587b3bf6e8),
        uint256(0x1d9cc8a91efd59e65fac287c0cf36a4df8a2d4ee6acc6922735b1888797a80a7)
      ],
      [
        uint256(0x13c0bb5e0b93748968da9ea944e0171706267e57acabf0df3669899facfae72f),
        uint256(0x1636369d446ae2b2abdf113785b94a304085a4dc20259c0716822bf04c72358c)
      ]
    );
    vk.delta = Rollup4Pairing.G2Point(
      [
        uint256(0x2a1982eb06a4650be353ffefa6189a052128673384212d56b2d67c2ebe667189),
        uint256(0x04f06d498fc7d8538d58dfdb0a3b5fdc7a5b4c4ea676bff4dc3a9f98af600ffd)
      ],
      [
        uint256(0x1f08c69d4d1526579f8d328d91d537fbf3a3392be4540b69c29d7d4c11d99b80),
        uint256(0x059b4d8986a90ca94bd076c2714bc3baf3e68de82af0a170ef2574ae3775bbd0)
      ]
    );
    vk.gamma_abc = new Rollup4Pairing.G1Point[](5);
    vk.gamma_abc[0] = Rollup4Pairing.G1Point(
      uint256(0x1685b2347ddd5f20ef72355a69981ae77b8e8352818d7f827e16f9a091e8499a),
      uint256(0x0bb12eb226cf60a3e65431e1a1a15270c5e4506e7cc2c6a8c17bca93b02acafd)
    );
    vk.gamma_abc[1] = Rollup4Pairing.G1Point(
      uint256(0x08195c094512644e49a95a3559e4cf088d755c2361519cb12afde6479c9bc1e2),
      uint256(0x0f9e3c71ed3d33c3320646168d27ac4fec9b2203f1f6c6cbaf0217f952e3c3d9)
    );
    vk.gamma_abc[2] = Rollup4Pairing.G1Point(
      uint256(0x1fe6bf64bf9f0965e75c122a9a82c646800ebc6a7e8774d701380f71fc4713e3),
      uint256(0x28cd9b1ef3667ebe5d714feacd7fa328dfedd5cff9bcc9335490a149f960b4c4)
    );
    vk.gamma_abc[3] = Rollup4Pairing.G1Point(
      uint256(0x104c02ef5fe3fca9f223ef74779661bce56236a89e3a0c8243f4f05b3afad270),
      uint256(0x002d6905c520fa1645b9d3398d4eead1a6635acf1b54bac8b3c04c9f6c54a79f)
    );
    vk.gamma_abc[4] = Rollup4Pairing.G1Point(
      uint256(0x02b2a90336704c80ad441c8b675b7265045b551bd1d2120a0a4e4fa86a6ed172),
      uint256(0x23c32cc5d6fa9d513899085419a202f0da3936bff3c786e5601337ac8910b5f8)
    );
  }

  function verify(uint256[] memory input, Proof memory proof) internal view returns (uint256) {
    uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    VerifyingKey memory vk = verifyingKey();
    require(input.length + 1 == vk.gamma_abc.length);
    // Compute the linear combination vk_x
    Rollup4Pairing.G1Point memory vk_x = Rollup4Pairing.G1Point(0, 0);
    for (uint256 i = 0; i < input.length; i++) {
      require(input[i] < snark_scalar_field);
      vk_x = Rollup4Pairing.addition(vk_x, Rollup4Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
    }
    vk_x = Rollup4Pairing.addition(vk_x, vk.gamma_abc[0]);
    if (
      !Rollup4Pairing.pairingProd4(
        proof.a,
        proof.b,
        Rollup4Pairing.negate(vk_x),
        vk.gamma,
        Rollup4Pairing.negate(proof.c),
        vk.delta,
        Rollup4Pairing.negate(vk.alpha),
        vk.beta
      )
    ) return 1;
    return 0;
  }

  function verifyTx(Proof memory proof, uint256[] memory input) public view returns (bool r) {
    require(input.length == 4, "invalid input length");
    if (verify(input, proof) == 0) {
      return true;
    } else {
      return false;
    }
  }
}
