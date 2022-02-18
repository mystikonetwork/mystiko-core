pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "MerkleTree.circom";

template CommitmentHasher(nPkBits, nRandomBits) {
    signal input publicKey;
    signal input randomP;
    signal input randomR;
    signal input randomS;
    signal input amount;
    signal output hash;

    component hasher1 = Poseidon(3);
    component hasher2 = Sha256(512 + nRandomBits);
    component hashNum = Bits2Num(256);

    hasher1.inputs[0] <== publicKey;
    hasher1.inputs[1] <== randomP;
    hasher1.inputs[2] <== randomR;

    component kBits = Num2Bits(256);
    component amountBits = Num2Bits(256);
    component randomSBits = Num2Bits(nRandomBits);

    kBits.in <== hasher1.out;
    amountBits.in <== amount;
    randomSBits.in <== randomS;

    for (var i = 0; i < 256; i++) {
      hasher2.in[i] <== kBits.out[255 - i];
      hasher2.in[i + 256] <== amountBits.out[255 - i];
    }

    for (var i = 0; i < nRandomBits; i++) {
      hasher2.in[i + 512] <== randomSBits.out[nRandomBits - i - 1];
    }

    for (var i = 0; i < 256; i++) {
      hashNum.in[i] <== hasher2.out[255 - i];
    }

    hash <== hashNum.out;
}

template SerialNumberHasher(nSkBits, nRandomBits) {
    signal input randomP;
    signal input secretKey;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== randomP;
    hasher.inputs[1] <== secretKey;

    hash <== hasher.out;
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels, nPkBits, nSkBits, nRandomBits) {
    signal input rootHash;
    signal input serialNumber;
    signal input amount;
    signal input recipient;
    signal input publicKey;
    signal input secretKey;
    signal input randomP;
    signal input randomR;
    signal input randomS;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input commitment;

    component commitmentHasher = CommitmentHasher(nPkBits, nRandomBits);
    component snHasher = SerialNumberHasher(nSkBits, nRandomBits);
    component ownershipChecker = BabyPbk();
    component tree = RawMerkleTree(levels);
    commitmentHasher.publicKey <== publicKey;
    commitmentHasher.randomP <== randomP;
    commitmentHasher.randomR <== randomR;
    commitmentHasher.randomS <== randomS;
    commitmentHasher.amount <== amount;
    snHasher.randomP <== randomP;
    snHasher.secretKey <== secretKey;
    ownershipChecker.in <== secretKey;
    tree.leaf <== commitment;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    commitment === commitmentHasher.hash;
    serialNumber === snHasher.hash;
    publicKey === ownershipChecker.Ax;
    tree.root === rootHash;

    signal recipientSquare;
    recipientSquare <== recipient * recipient;
}

component main {public [rootHash, serialNumber, amount, recipient]} = Withdraw(20, 256, 256, 128);
