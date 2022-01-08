include "../node_modules/circomlib/circuits/pedersen.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";
include "merkleTree.circom";

template CommitmentHasher() {
    signal input publicKey;
    signal input randomSecret;
    signal input randomTrapdoorR;
    signal input randomTrapdoorS;
    signal input amount;
    signal output hash;

    component publicKeyBits = Num2Bits(256);
    component randomSecretBits = Num2Bits(128);
    component randomTrapdoorRBits = Num2Bits(128);
    component randomTrapdoorSBits = Num2Bits(128);
    component amountBits = Num2Bits(256);
    component hasher1Bits = Num2Bits(256);
    component hasher1 = Pedersen(512);
    component hasher2 = Pedersen(640);
    component hashNum = Bits2Num(256);

    publicKeyBits.in <== publicKey;
    randomSecretBits.in <== randomSecret;
    randomTrapdoorRBits.in <== randomTrapdoorR;
    randomTrapdoorSBits.in <== randomTrapdoorS;
    amountBits.in <== amount;

    for (var i = 0; i < 128; i++) {
        hasher1.in[i] <== publicKeyBits.out[i];
        hasher1.in[i + 128] <== publicKeyBits.out[i + 128];
        hasher1.in[i + 256] <== randomSecretBits.out[i];
        hasher1.in[i + 384] <== randomTrapdoorRBits.out[i];
    }

    hasher1Bits.in <== hasher1.out[0];

    for (var i = 0; i < 128; i++) {
        hasher2.in[i] <== hasher1Bits.out[i];
        hasher2.in[i + 128] <== hasher1Bits.out[i + 128];
        hasher2.in[i + 256] <== amountBits.out[i];
        hasher2.in[i + 384] <== amountBits.out[i + 128];
        hasher2.in[i + 512] <== randomTrapdoorSBits.out[i];
    }

    hash <== hasher2.out[0];
}

template SerialNumberHasher() {
    signal input randomSecret;
    signal input secretKey;
    signal output hash;

    component randomSecretBits = Num2Bits(128);
    component secretKeyBits = Num2Bits(256);
    component hasher = Pedersen(384);
    component hashNum = Bits2Num(256);

    randomSecretBits.in <== randomSecret;
    secretKeyBits.in <== secretKey;

    for (var i = 0; i < 128; i++) {
        hasher.in[i] <== randomSecretBits.out[i];
        hasher.in[i + 128] <== secretKeyBits.out[i];
        hasher.in[i + 256] <== secretKeyBits.out[i + 128];
    }

    hash <== hasher.out[0];
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels) {
    signal input rootHash;
    signal input serialNumber;
    signal input amount;
    signal private input publicKey;
    signal private input secretKey;
    signal private input randomSecret;
    signal private input randomTrapdoorR;
    signal private input randomTrapdoorS;
    signal private input pathElements[levels];
    signal private input pathIndices[levels];
    signal private input commitment;

    component commitmentHasher = CommitmentHasher();
    component snHasher = SerialNumberHasher();
    component ownershipChecker = BabyPbk();
    component treeChecker = MerkleTreeChecker(levels);
    commitmentHasher.publicKey <== publicKey;
    commitmentHasher.randomSecret <== randomSecret;
    commitmentHasher.randomTrapdoorR <== randomTrapdoorR;
    commitmentHasher.randomTrapdoorS <== randomTrapdoorS;
    commitmentHasher.amount <== amount;
    snHasher.randomSecret <== randomSecret;
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

component main = Withdraw(20);
