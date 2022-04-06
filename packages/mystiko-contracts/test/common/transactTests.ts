import BN from 'bn.js';
import { expect } from 'chai';
import { ethers } from 'ethers';
import { Proof } from 'zokrates-js';
import { CommitmentV1, MystikoProtocolV2 } from '@mystikonetwork/protocol';
import { MerkleTree, toBuff, toHex } from '@mystikonetwork/utils';
import { CommitmentInfo } from './commitment';

const { waffle } = require('hardhat');

function generateSignatureKeys(): { wallet: ethers.Wallet; pk: Buffer; sk: Buffer } {
  const wallet = ethers.Wallet.createRandom();
  return { wallet, pk: toBuff(wallet.address), sk: toBuff(wallet.privateKey) };
}

async function generateProof(
  protocol: MystikoProtocolV2,
  numInputs: number,
  numOutputs: number,
  commitmentInfo: CommitmentInfo<CommitmentV1>,
  inCommitmentsIndices: number[],
  sigPk: Buffer,
  publicAmount: BN,
  relayerFeeAmount: BN,
  outAmounts: BN[],
  rollupFeeAmounts: BN[],
  programFile: string,
  abiFile: string,
  provingKeyFile: string,
): Promise<{ proof: Proof; outCommitments: CommitmentV1[] }> {
  const merkleTree = new MerkleTree(
    commitmentInfo.commitments.map((c) => c.commitmentHash),
    { maxLevels: protocol.merkleTreeLevels },
  );
  const inVerifyPks: Buffer[] = [];
  const inVerifySks: Buffer[] = [];
  const inEncPks: Buffer[] = [];
  const inEncSks: Buffer[] = [];
  const inCommitments: BN[] = [];
  const inPrivateNotes: Buffer[] = [];
  const pathIndices: number[][] = [];
  const pathElements: BN[][] = [];
  for (let i = 0; i < numInputs; i += 1) {
    inVerifyPks.push(commitmentInfo.pkVerify);
    inVerifySks.push(protocol.secretKeyForVerification(commitmentInfo.rawSkVerify));
    inEncPks.push(commitmentInfo.pkEnc);
    inEncSks.push(protocol.secretKeyForEncryption(commitmentInfo.rawSkEnc));
    inCommitments.push(commitmentInfo.commitments[inCommitmentsIndices[i]].commitmentHash);
    inPrivateNotes.push(commitmentInfo.commitments[inCommitmentsIndices[i]].privateNote);
    const fullPath = merkleTree.path(inCommitmentsIndices[i]);
    pathIndices.push(fullPath.pathIndices);
    pathElements.push(fullPath.pathElements);
  }
  const outVerifyPks: Buffer[] = [];
  const outCommitments: BN[] = [];
  const outFullCommitments: CommitmentV1[] = [];
  const outRandomPs: BN[] = [];
  const outRandomRs: BN[] = [];
  const outRandomSs: BN[] = [];
  const outCommitmentsPromises: Promise<CommitmentV1>[] = [];
  for (let i = 0; i < numOutputs; i += 1) {
    outVerifyPks.push(commitmentInfo.pkVerify);
    outCommitmentsPromises.push(
      protocol.commitment(commitmentInfo.pkVerify, commitmentInfo.pkEnc, outAmounts[i]),
    );
  }
  (await Promise.all(outCommitmentsPromises)).forEach((commitment) => {
    outFullCommitments.push(commitment);
    outCommitments.push(commitment.commitmentHash);
    outRandomPs.push(commitment.randomP);
    outRandomRs.push(commitment.randomR);
    outRandomSs.push(commitment.randomS);
  });
  return protocol
    .zkProveTransaction({
      numInputs,
      numOutputs,
      inVerifyPks,
      inVerifySks,
      inEncPks,
      inEncSks,
      inCommitments,
      inPrivateNotes,
      pathIndices,
      pathElements,
      sigPk,
      treeRoot: merkleTree.root(),
      publicAmount,
      relayerFeeAmount,
      rollupFeeAmounts,
      outVerifyPks,
      outAmounts,
      outCommitments,
      outRandomPs,
      outRandomRs,
      outRandomSs,
      programFile,
      abiFile,
      provingKeyFile,
    })
    .then((proof) => ({ proof, outCommitments: outFullCommitments }));
}

function signRequest(
  wallet: ethers.Wallet,
  publicRecipient: string,
  relayerAddress: string,
  outEncryptedNotes: Buffer[],
): Promise<string> {
  const bytes = Buffer.concat([toBuff(publicRecipient), toBuff(relayerAddress), ...outEncryptedNotes]);
  return wallet.signMessage(toBuff(ethers.utils.keccak256(bytes)));
}

function buildRequest(
  numInputs: number,
  numOutputs: number,
  proof: Proof,
  publicRecipientAddress: string,
  relayerAddress: string,
  outEncryptedNotes: Buffer[],
) {
  return [
    [proof.proof.a, proof.proof.b, proof.proof.c],
    proof.inputs[0],
    proof.inputs.slice(1, 1 + numInputs),
    proof.inputs.slice(1 + numInputs, 1 + 2 * numInputs),
    proof.inputs[1 + 2 * numInputs],
    proof.inputs[2 + 2 * numInputs],
    proof.inputs[3 + 2 * numInputs],
    proof.inputs.slice(4 + 2 * numInputs, 4 + 2 * numInputs + numOutputs),
    proof.inputs.slice(4 + 2 * numInputs + numOutputs, 4 + 2 * numInputs + 2 * numOutputs),
    publicRecipientAddress,
    relayerAddress,
    outEncryptedNotes.map(toHex),
  ];
}

export function testTransact(
  protocol: MystikoProtocolV2,
  mystikoContract: any,
  transactVerifier: any,
  commitmentInfo: CommitmentInfo<CommitmentV1>,
  inCommitmentsIndices: number[],
  publicAmount: BN,
  relayerFeeAmount: BN,
  outAmounts: BN[],
  rollupFeeAmounts: BN[],
  programFile: string,
  abiFile: string,
  provingKeyFile: string,
  vkeyFile: string,
) {
  const numInputs = inCommitmentsIndices.length;
  const numOutputs = outAmounts.length;
  describe(`Test Mystiko transaction${numInputs}x${numOutputs}`, () => {
    before(async () => {
      await mystikoContract.enableTransactVerifier(numInputs, numOutputs, transactVerifier.address);
    });

    it('should transact successfully', async () => {
      const signatureKeys = generateSignatureKeys();
      const { proof, outCommitments } = await generateProof(
        protocol,
        numInputs,
        numOutputs,
        commitmentInfo,
        inCommitmentsIndices,
        signatureKeys.pk,
        publicAmount,
        relayerFeeAmount,
        outAmounts,
        rollupFeeAmounts,
        programFile,
        abiFile,
        provingKeyFile,
      );
      expect(await protocol.zkVerify(proof, vkeyFile)).to.equal(true);
      const outEncryptedNotes = outCommitments.map((c) => c.privateNote);
      const publicRecipientAddress = '0x2Bd6FBfDA256cebAC13931bc3E91F6e0f59A5e23';
      const relayerAddress = '0xc9192277ea18ff49618E412197C9c9eaCF43A5e3';
      const signature = signRequest(
        signatureKeys.wallet,
        publicRecipientAddress,
        relayerAddress,
        outEncryptedNotes,
      );
      const request = buildRequest(
        numInputs,
        numOutputs,
        proof,
        publicRecipientAddress,
        relayerAddress,
        outEncryptedNotes,
      );
      const tx = await mystikoContract.transact(request, signature);
      const txReceipt = await waffle.provider.getTransactionReceipt(tx.hash);
      const gasUsed = txReceipt.cumulativeGasUsed.toString();
      console.log(`gas used: ${gasUsed}`);
    });
  });
}
