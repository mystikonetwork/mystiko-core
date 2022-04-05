// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Rollup16Pairing {
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

contract Rollup16Verifier {
  using Rollup16Pairing for *;
  struct VerifyingKey {
    Rollup16Pairing.G1Point alpha;
    Rollup16Pairing.G2Point beta;
    Rollup16Pairing.G2Point gamma;
    Rollup16Pairing.G2Point delta;
    Rollup16Pairing.G1Point[] gamma_abc;
  }
  struct Proof {
    Rollup16Pairing.G1Point a;
    Rollup16Pairing.G2Point b;
    Rollup16Pairing.G1Point c;
  }

  function verifyingKey() internal pure returns (VerifyingKey memory vk) {
    vk.alpha = Rollup16Pairing.G1Point(
      uint256(0x132af120ed82afa3df048a36e4ec35d522068162854751a94fb50f443aa75f64),
      uint256(0x13cd4ff5523b3be6f111b02d5792ce83c02431b467a918865e1559ff40bf4460)
    );
    vk.beta = Rollup16Pairing.G2Point(
      [
        uint256(0x2450d816054a1266c849410e1566fb034ca9cb2220bdde012cc786eb7b83cf46),
        uint256(0x0b4476f6f8b00ef6739b41099199dc83c9586c8bc94b8687ea154bbaa4c00c61)
      ],
      [
        uint256(0x2e8cc897261f06cebfbf7c3ade122625e3df735b9973b27e3e04c4e24db69096),
        uint256(0x1fe259b8f9e9d417249457cfce1d3cf2659264159765dbff32c4d177ba8abdec)
      ]
    );
    vk.gamma = Rollup16Pairing.G2Point(
      [
        uint256(0x02f03259863c50312d3780dba25eb4e828fff6934ced12ffe261891be94a823b),
        uint256(0x1fb4f0c5492cdb718a6226bcf7d9cc378a5cbc1a4d9888047ed594803ed326c9)
      ],
      [
        uint256(0x2cf3a7e078f5944d90c2ee5b912082921cd87cf27c6f145e807e78cc8f243af1),
        uint256(0x21278639cd2d931feadfbde4f8ea0513f4fbc1e11610d91c059b4dc83ff26607)
      ]
    );
    vk.delta = Rollup16Pairing.G2Point(
      [
        uint256(0x224f6bd9d49a90f98fd0283eae16a198e796030b90cfa7eac41657807be486c7),
        uint256(0x00c71ccd4267b8b89f64c4a9964fd1adce4c7d2adc104f5fddb958e2edcc3d8f)
      ],
      [
        uint256(0x109c21edde4a8226360239b7f6b0d66774442d36776d2e076f0fcc08f88df7c9),
        uint256(0x0efbd6bb75ef22c52075e2a6976d5bd502d9a2612dcb702cdd6b93f76212b1fb)
      ]
    );
    vk.gamma_abc = new Rollup16Pairing.G1Point[](5);
    vk.gamma_abc[0] = Rollup16Pairing.G1Point(
      uint256(0x13f5bc4d83fe4094beccda534dbf455c5121b17f6aded7871b67c56e8f78ac50),
      uint256(0x052f2c8cb9d8895bcb094542b6533616f790c573375f047dfb14bd30ef5c494c)
    );
    vk.gamma_abc[1] = Rollup16Pairing.G1Point(
      uint256(0x111202d0d03729f1a524b9b49b7514da9298b1ef303a21975ec63401bff900bf),
      uint256(0x2e79907f5202ecc99e9f49dbe5d1d9303b17466115c7250916a222bc00ebe044)
    );
    vk.gamma_abc[2] = Rollup16Pairing.G1Point(
      uint256(0x2b62bee7f4dfb6bd17d5b4b19d91d80329c490d948e75880bc3121ce23d907ae),
      uint256(0x2501fea7cb5d94ae28d963c9f7d751d4ab2ea6b73956622b73dfbca31b55c8db)
    );
    vk.gamma_abc[3] = Rollup16Pairing.G1Point(
      uint256(0x22f9790c84ce71671b5422e30eaebc664197c8eb13edea28df3faddd8e2a51d8),
      uint256(0x15cf3d3341bdf954ac80ee9fe9606c14106ba45a7bf035b8d0a5db71bb16655e)
    );
    vk.gamma_abc[4] = Rollup16Pairing.G1Point(
      uint256(0x1122b6b6b3ceb5edb553596f6d676280095aa4961a0290186752244a065e62a1),
      uint256(0x219cd9a2791262ae2a265e9701299278a6d9f5ff81b496bf0d8341776aa92598)
    );
  }

  function verify(uint256[] memory input, Proof memory proof) internal view returns (uint256) {
    uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    VerifyingKey memory vk = verifyingKey();
    require(input.length + 1 == vk.gamma_abc.length);
    // Compute the linear combination vk_x
    Rollup16Pairing.G1Point memory vk_x = Rollup16Pairing.G1Point(0, 0);
    for (uint256 i = 0; i < input.length; i++) {
      require(input[i] < snark_scalar_field);
      vk_x = Rollup16Pairing.addition(vk_x, Rollup16Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
    }
    vk_x = Rollup16Pairing.addition(vk_x, vk.gamma_abc[0]);
    if (
      !Rollup16Pairing.pairingProd4(
        proof.a,
        proof.b,
        Rollup16Pairing.negate(vk_x),
        vk.gamma,
        Rollup16Pairing.negate(proof.c),
        vk.delta,
        Rollup16Pairing.negate(vk.alpha),
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
