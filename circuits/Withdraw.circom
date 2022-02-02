pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/pedersen.circom";
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

    component publicKeyBits = Num2Bits(nPkBits);
    component randomPBits = Num2Bits(nRandomBits);
    component randomRBits = Num2Bits(nRandomBits);
    component hasher1Bits = Num2Bits(256);
    component hasher1 = Pedersen(nPkBits + nRandomBits + nRandomBits);
    component hasher2 = Poseidon(3);
    component hashNum = Bits2Num(256);

    publicKeyBits.in <== publicKey;
    randomPBits.in <== randomP;
    randomRBits.in <== randomR;

    for (var i = 0; i < nPkBits; i++) {
        hasher1.in[i] <== publicKeyBits.out[i];
    }

    for (var i = 0; i < nRandomBits; i++) {
        hasher1.in[i + nPkBits] <== randomPBits.out[i];
        hasher1.in[i + nPkBits + nRandomBits] <== randomRBits.out[i];
    }

    hasher2.inputs[0] <== hasher1.out[0];
    hasher2.inputs[1] <== amount;
    hasher2.inputs[2] <== randomS;

    hash <== hasher2.out;
}

template SerialNumberHasher(nSkBits, nRandomBits) {
    signal input randomP;
    signal input secretKey;
    signal output hash;

    component randomPBits = Num2Bits(nRandomBits);
    component secretKeyBits = Num2Bits(nSkBits);
    component hasher = Pedersen(nRandomBits + nSkBits);

    randomPBits.in <== randomP;
    secretKeyBits.in <== secretKey;

    for (var i = 0; i < nRandomBits; i++) {
        hasher.in[i] <== randomPBits.out[i];
    }

    for (var i = 0; i < nSkBits; i++) {
        hasher.in[i + nRandomBits] <== secretKeyBits.out[i];
    }


    hash <== hasher.out[0];
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels, nPkBits, nSkBits, nRandomBits) {
    signal input rootHash;
    signal input serialNumber;
    signal input amount;
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
}

component main {public [rootHash, serialNumber, amount]} = Withdraw(20, 256, 256, 128);
