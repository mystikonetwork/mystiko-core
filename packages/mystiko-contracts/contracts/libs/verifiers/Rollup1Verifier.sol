// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Rollup1Pairing {
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

contract Rollup1Verifier {
  using Rollup1Pairing for *;
  struct VerifyingKey {
    Rollup1Pairing.G1Point alpha;
    Rollup1Pairing.G2Point beta;
    Rollup1Pairing.G2Point gamma;
    Rollup1Pairing.G2Point delta;
    Rollup1Pairing.G1Point[] gamma_abc;
  }
  struct Proof {
    Rollup1Pairing.G1Point a;
    Rollup1Pairing.G2Point b;
    Rollup1Pairing.G1Point c;
  }

  function verifyingKey() internal pure returns (VerifyingKey memory vk) {
    vk.alpha = Rollup1Pairing.G1Point(
      uint256(0x272bfabae4cdb836650771c53226d68271cbc0c24df75e0821be52f7a5d4086d),
      uint256(0x1a26102a034541e842add44e99d4350fb3ed0ed7168c4eb643ab01c9392ce4da)
    );
    vk.beta = Rollup1Pairing.G2Point(
      [
        uint256(0x2fdd223522694fe90ab282d35213223aba99772c07f78c1cdca64eb91717c77a),
        uint256(0x043eabd727bbfd97a69a110e14f3096b44fa3526397f7d62f22d3bb4306f312f)
      ],
      [
        uint256(0x1d67c37ed7cbe7f4fef3998032c0f3020946c4b1d1f8c6c8a5a5803f10bc42e0),
        uint256(0x25751f93b445741e82fcf53d117e4de67f1c869a634dbe2bb52ca9df7ee4360a)
      ]
    );
    vk.gamma = Rollup1Pairing.G2Point(
      [
        uint256(0x01f8283e28f9777273ca315cf5ffd62ddb47c0beb412f323f0c49167a5e98abd),
        uint256(0x040d61acebc44462a2e9ee7edcee2a634b5af2fa0726246b2767ae1d92723bdb)
      ],
      [
        uint256(0x29b203e829bea2dd01e33c1deb068ec77d066bb56141f64b2a0c7121b80ad3e9),
        uint256(0x2247a816ba0e831eb69f679cc0d78e6f6539509882ba992c0caf8bc36471443d)
      ]
    );
    vk.delta = Rollup1Pairing.G2Point(
      [
        uint256(0x238e52f9682c5f2f1e5e7e6292015234794c10d472448b5ac6a45654d51bb855),
        uint256(0x27655646cc3d7e51358715fd9079bc391ce1fe01e1077b40b53b8220faad94cf)
      ],
      [
        uint256(0x1573103fb1df25bca0f6ab0f5d4907e652b6b87f0bcc3a4e23723b3da25e3431),
        uint256(0x2deaac51132d37fc594efb43e919c2da14ca6194993e72a257edcb269710d7a4)
      ]
    );
    vk.gamma_abc = new Rollup1Pairing.G1Point[](5);
    vk.gamma_abc[0] = Rollup1Pairing.G1Point(
      uint256(0x2bf7b46945bec007d50577eb96f3847a1cf84de8af24d5408fcb3095bfdc71f9),
      uint256(0x2b64d3ceba52cf7e684089bcf13ec782737b59521cdd7c3d386c57fe826467b6)
    );
    vk.gamma_abc[1] = Rollup1Pairing.G1Point(
      uint256(0x1ed2f708cae95c17b873fc9c4a03085ddd8d67890ebe8a480e530a18e7739cc5),
      uint256(0x2cfd7693bc2a4bc8cb3748750e4bb72c160b83724bd10bf5768fc077e8daa798)
    );
    vk.gamma_abc[2] = Rollup1Pairing.G1Point(
      uint256(0x01ae16f2a453390a075d3d2b2feb363d9d06e8b58d420c2ca7b8ba08326d47d4),
      uint256(0x1d2d5a923b222260687cea3640ab3d6123835a3b3a0b72d66a9d10ccbcd45d8a)
    );
    vk.gamma_abc[3] = Rollup1Pairing.G1Point(
      uint256(0x305b20ade6be90bf5e8acf2a421a3307f6178c31a0f6ce5126cb3bc650e5e56c),
      uint256(0x0aee95ba67128c85bbd9f9d3246e8694e88b65d32f749d3f5a415535ee18c6f5)
    );
    vk.gamma_abc[4] = Rollup1Pairing.G1Point(
      uint256(0x2a3dd21da07b4c2bb34fd3b6602b9c6372dde9239b5d805e7430cf99d6e74edd),
      uint256(0x1e3746847add671638f095f64c91860c37c5479e2a766ec264bdd7b24aef0de8)
    );
  }

  function verify(uint256[] memory input, Proof memory proof) internal view returns (uint256) {
    uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    VerifyingKey memory vk = verifyingKey();
    require(input.length + 1 == vk.gamma_abc.length);
    // Compute the linear combination vk_x
    Rollup1Pairing.G1Point memory vk_x = Rollup1Pairing.G1Point(0, 0);
    for (uint256 i = 0; i < input.length; i++) {
      require(input[i] < snark_scalar_field);
      vk_x = Rollup1Pairing.addition(vk_x, Rollup1Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
    }
    vk_x = Rollup1Pairing.addition(vk_x, vk.gamma_abc[0]);
    if (
      !Rollup1Pairing.pairingProd4(
        proof.a,
        proof.b,
        Rollup1Pairing.negate(vk_x),
        vk.gamma,
        Rollup1Pairing.negate(proof.c),
        vk.delta,
        Rollup1Pairing.negate(vk.alpha),
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
