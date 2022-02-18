pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "MerkleTree.circom";

template MerkleTreeUpdater(levels, zeroLeaf) {
  signal input oldRoot;
  signal input newRoot;
  signal input newLeaf;
  signal input pathIndices;
  signal input pathElements[levels];

  component pathIndicesBits = Num2Bits(levels);
  pathIndicesBits.in <== pathIndices;

  component oldTree = RawMerkleTree(levels);
  for(var i = 0; i < levels; i++) {
    oldTree.pathIndices[i] <== pathIndicesBits.out[i];
    oldTree.pathElements[i] <== pathElements[i];
  }
  oldTree.leaf <== zeroLeaf;
  oldTree.root === oldRoot;

  component newTree = RawMerkleTree(levels);
  for(var i = 0; i < levels; i++) {
    newTree.pathIndices[i] <== pathIndicesBits.out[i];
    newTree.pathElements[i] <== pathElements[i];
  }
  newTree.leaf <== newLeaf;
  newTree.root === newRoot;
}
