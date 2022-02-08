pragma circom 2.0.0;

include "MerkleTreeBatchUpdater.circom";

component main{public [oldRoot, newRoot, pathIndices, leafHash]} = MerkleTreeBatchUpdater(20, 4, nthZeroElement(4));
