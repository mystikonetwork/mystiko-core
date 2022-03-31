pragma circom 2.0.0;

include "MerkleTreeBatchUpdater.circom";

component main{public [oldRoot, newRoot, pathIndices, leafHash]} = MerkleTreeBatchUpdater(20, 0, nthZeroElement(0));
