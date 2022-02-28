import { MerkleTree, v1Protocol } from '@mystiko/protocol';
import { toHex, toBuff, toDecimals, toFixedLenHex, toHexNoPrefix, toBN } from '@mystiko/utils';

const MystikoCoreMain = artifacts.require('MystikoWithPolyMain');
const MystikoCoreERC20 = artifacts.require('MystikoWithPolyERC20');
const RelayProxy = artifacts.require('PolyCrossChainManagerMock');
const Verifier = artifacts.require('WithdrawVerifier');
const Hasher2 = artifacts.require('Hasher2');
const TestToken = artifacts.require('TestToken');

contract('MystikoWithPolyERC20ToMain', (accounts) => {
  let mystikoCoreSourceERC20;
  let mystikoCoreDestinationMain;
  let relayProxy;
  let hasher2;
  let verifier;
  let testToken;
  let amount = toBN(toDecimals(2, 16).toString());

  before(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env;
    const SOURCE_CHAIN_ID = 1100;
    const DESTINATION_CHAIN_ID = 1200;

    testToken = await TestToken.deployed();
    verifier = await Verifier.deployed();
    hasher2 = await Hasher2.deployed();
    relayProxy = await RelayProxy.new();

    mystikoCoreSourceERC20 = await MystikoCoreERC20.new(
      relayProxy.address,
      DESTINATION_CHAIN_ID,
      verifier.address,
      testToken.address,
      hasher2.address,
      MERKLE_TREE_HEIGHT,
    );

    mystikoCoreDestinationMain = await MystikoCoreMain.new(
      relayProxy.address,
      SOURCE_CHAIN_ID,
      verifier.address,
      hasher2.address,
      MERKLE_TREE_HEIGHT,
    );

    await relayProxy.setChainPair(
      SOURCE_CHAIN_ID,
      mystikoCoreSourceERC20.address,
      DESTINATION_CHAIN_ID,
      mystikoCoreDestinationMain.address,
    );

    await mystikoCoreSourceERC20.setPeerContractAddress(mystikoCoreDestinationMain.address);
    await mystikoCoreDestinationMain.setPeerContractAddress(mystikoCoreSourceERC20.address);

    await web3.eth.sendTransaction({
      from: accounts[3],
      to: accounts[1],
      value: toDecimals(50, 18).toString(),
    });

    await web3.eth.sendTransaction({
      from: accounts[1],
      to: mystikoCoreDestinationMain.address,
      value: amount.toString(),
    });
  });

  describe('Test basic read operations', () => {
    it('should set token correctly information correctly', async () => {
      const bridgeTypeSource = await mystikoCoreSourceERC20.bridgeType();
      const assetTypeSource = await mystikoCoreSourceERC20.assetType();
      expect(bridgeTypeSource).to.equal('poly');
      expect(assetTypeSource).to.equal('erc20');

      const bridgeTypeDestination = await mystikoCoreDestinationMain.bridgeType();
      const assetTypeDestination = await mystikoCoreDestinationMain.assetType();
      expect(bridgeTypeDestination).to.equal('poly');
      expect(assetTypeDestination).to.equal('main');
    });

    it('should set verifier information correctly', async () => {
      expect(await mystikoCoreSourceERC20.getVerifierAddress()).to.equal(verifier.address);
      expect(await mystikoCoreDestinationMain.getVerifierAddress()).to.equal(verifier.address);
    });

    it('should set hasher information correctly', async () => {
      expect(await mystikoCoreSourceERC20.getHasherAddress()).to.equal(hasher2.address);
      expect(await mystikoCoreDestinationMain.getHasherAddress()).to.equal(hasher2.address);
    });
  });

  const rawSkVerify = v1Protocol.randomBytes(v1Protocol.VERIFY_SK_SIZE);
  const rawSkEnc = v1Protocol.randomBytes(v1Protocol.ENCRYPT_SK_SIZE);
  const skVerify = v1Protocol.secretKeyForVerification(rawSkVerify);
  const skEnc = v1Protocol.secretKeyForEncryption(rawSkEnc);
  const pkVerify = v1Protocol.publicKeyForVerification(rawSkVerify);
  const pkEnc = v1Protocol.publicKeyForEncryption(rawSkEnc);
  let depositTx;

  describe('Test deposit operation', () => {
    it('should transfer token to account 1 correctly', async () => {
      const tokenContract = await TestToken.deployed();
      const initialBalanceOfAccount0 = await tokenContract.balanceOf(accounts[0]);
      await tokenContract.transfer(accounts[1], amount.toString(), { from: accounts[0] });
      const finalBalanceOfAccount0 = await tokenContract.balanceOf(accounts[0]);
      const differenceBalanceOfAccount0 = toBN(initialBalanceOfAccount0).sub(toBN(finalBalanceOfAccount0));
      expect(differenceBalanceOfAccount0.toString()).to.equal(amount.toString());
      const balanceOfAccount1 = await tokenContract.balanceOf(accounts[1]);
      expect(balanceOfAccount1.toString()).to.equal(amount.toString());

      await testToken.approve(mystikoCoreSourceERC20.address, amount.toString(), { from: accounts[1] });
      const allowance = await testToken.allowance(accounts[1], mystikoCoreSourceERC20.address);
      expect(allowance.toString()).to.equal(amount.toString());
    });

    it('should deposit successfully', async () => {
      const { commitmentHash, privateNote, k, randomS } = await v1Protocol.commitment(
        pkVerify,
        pkEnc,
        amount,
      );
      const initialBalanceOfAccount1 = await testToken.balanceOf(accounts[1]);
      const gasEstimated = await mystikoCoreSourceERC20.deposit.estimateGas(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        '0',
        { from: accounts[1] },
      );

      depositTx = await mystikoCoreSourceERC20.deposit(
        amount,
        toFixedLenHex(commitmentHash),
        toFixedLenHex(k),
        toFixedLenHex(randomS, v1Protocol.RANDOM_SK_SIZE),
        toHex(privateNote),
        '0',
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );

      const finalBalanceOfAccount1 = await testToken.balanceOf(accounts[1]);
      const differenceBalanceOfAccount1 = toBN(initialBalanceOfAccount1).sub(toBN(finalBalanceOfAccount1));
      expect(differenceBalanceOfAccount1.toString()).to.be.equal(amount.toString());
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      expect(depositEvent).to.not.equal(undefined);
      expect(depositEvent.args.amount.toString()).to.equal(amount.toString());
      expect(depositEvent.args.commitmentHash).to.equal(toFixedLenHex(commitmentHash));
      expect(depositEvent.args.encryptedNote).to.equal(toHex(privateNote));
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      expect(merkleTreeInsertEvent).to.not.equal(undefined);
      expect(merkleTreeInsertEvent.args.amount.toString()).to.equal(amount.toString());
      expect(merkleTreeInsertEvent.args.leaf).to.equal(toFixedLenHex(commitmentHash));
      expect(merkleTreeInsertEvent.args.leafIndex.eq(toBN(0))).to.equal(true);
      const levels = await mystikoCoreDestinationMain.getLevels();
      const tree = new MerkleTree([toBN(toHexNoPrefix(merkleTreeInsertEvent.args.leaf), 16)], {
        maxLevels: parseInt(levels),
      });
      const root = toBN(tree.root());
      const isKnownRoot = await mystikoCoreDestinationMain.isKnownRoot(toFixedLenHex(root));
      expect(isKnownRoot).to.equal(true);
    });
  });

  describe('Test withdraw operation', () => {
    let proof, publicSignals;
    it('should generate proof successfully', async () => {
      const depositEvent = depositTx.logs.find((e) => e['event'] === 'Deposit');
      const merkleTreeInsertEvent = depositTx.logs.find((e) => e['event'] === 'MerkleTreeInsert');
      const dAmount = toBN(depositEvent.args.amount.toString());
      const commitmentHash = toBN(toHexNoPrefix(depositEvent.args.commitmentHash), 16);
      const privateNote = toBuff(toHexNoPrefix(depositEvent.args.encryptedNote));
      const treeLeaves = [commitmentHash];
      const treeIndex = Number(merkleTreeInsertEvent.args.leafIndex);
      const fullProof = await v1Protocol.zkProveWithdraw(
        pkVerify,
        skVerify,
        pkEnc,
        skEnc,
        dAmount,
        accounts[2],
        commitmentHash,
        privateNote,
        treeLeaves,
        treeIndex,
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.wasm.gz',
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.zkey.gz',
      );
      proof = fullProof.proof;
      publicSignals = fullProof.publicSignals;
      expect(proof['pi_a'].length).to.be.gte(2);
      expect(proof['pi_b'].length).to.be.gte(2);
      expect(proof['pi_b'][0].length).to.equal(2);
      expect(proof['pi_b'][1].length).to.equal(2);
      expect(proof['pi_c'].length).to.be.gte(2);
      expect(publicSignals.length).to.equal(4);
      const result = await v1Protocol.zkVerify(
        proof,
        publicSignals,
        'node_modules/@mystiko/circuits/dist/circom/dev/Withdraw.vkey.json.gz',
      );
      expect(result).to.equal(true);
    });

    it('should withdraw successfully', async () => {
      const recipient = accounts[2];
      const proofA = [toBN(proof.pi_a[0]), toBN(proof.pi_a[1])];
      const proofB = [
        [toBN(proof.pi_b[0][1]), toBN(proof.pi_b[0][0])],
        [toBN(proof.pi_b[1][1]), toBN(proof.pi_b[1][0])],
      ];
      const proofC = [toBN(proof.pi_c[0]), toBN(proof.pi_c[1])];
      const rootHash = toBN(publicSignals[0]);
      const serialNumber = toBN(publicSignals[1]);
      const result = await verifier.verifyProof(proofA, proofB, proofC, [
        rootHash,
        serialNumber,
        amount,
        recipient,
      ]);
      expect(result).to.equal(true);
      const initialBalanceOfAccount2 = await web3.eth.getBalance(accounts[2]);
      const gasEstimated = await mystikoCoreDestinationMain.withdraw.estimateGas(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        { from: accounts[1] },
      );
      await mystikoCoreDestinationMain.withdraw(
        proofA,
        proofB,
        proofC,
        rootHash,
        serialNumber,
        amount,
        recipient,
        {
          from: accounts[1],
          gas: gasEstimated,
        },
      );
      const isSpent = await mystikoCoreDestinationMain.isSpent(serialNumber);
      expect(isSpent).to.equal(true);
      const finalBalanceOfAccount2 = await web3.eth.getBalance(accounts[2]);
      const differenceBalanceOfAccount2 = toBN(finalBalanceOfAccount2).sub(toBN(initialBalanceOfAccount2));
      expect(differenceBalanceOfAccount2.toString()).to.equal(amount.toString());
    });
  });
});
