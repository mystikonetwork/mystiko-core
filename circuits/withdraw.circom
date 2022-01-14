include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "merkleTree.circom";

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
    component hasher2 = MiMCSponge(2, 220, 1);
    component hasher3 = MiMCSponge(2, 220, 1);
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

    hasher2.ins[0] <== hasher1.out[0];
    hasher2.ins[1] <== amount;
    hasher2.k <== 0;
    hasher3.ins[0] <== hasher2.outs[0];
    hasher3.ins[1] <== randomS;
    hasher3.k <== 0;

    hash <== hasher3.outs[0];
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
    signal private input publicKey;
    signal private input secretKey;
    signal private input randomP;
    signal private input randomR;
    signal private input randomS;
    signal private input pathElements[levels];
    signal private input pathIndices[levels];
    signal private input commitment;

    component commitmentHasher = CommitmentHasher(nPkBits, nRandomBits);
    component snHasher = SerialNumberHasher(nSkBits, nRandomBits);
    component ownershipChecker = BabyPbk();
    component treeChecker = MerkleTreeChecker(levels);
    commitmentHasher.publicKey <== publicKey;
    commitmentHasher.randomP <== randomP;
    commitmentHasher.randomR <== randomR;
    commitmentHasher.randomS <== randomS;
    commitmentHasher.amount <== amount;
    snHasher.randomP <== randomP;
    snHasher.secretKey <== secretKey;
    ownershipChecker.in <== secretKey;
    treeChecker.root <== rootHash;
    treeChecker.leaf <== commitment;
    for (var i = 0; i < levels; i++) {
        treeChecker.pathElements[i] <== pathElements[i];
        treeChecker.pathIndices[i] <== pathIndices[i];
    }

    commitment === commitmentHasher.hash;
    serialNumber === snHasher.hash;
    publicKey === ownershipChecker.Ax;
}

component main = Withdraw(20, 256, 256, 128);
