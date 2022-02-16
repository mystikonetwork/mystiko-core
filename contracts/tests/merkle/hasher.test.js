import BN from 'bn.js';
import { toFixedLenHex } from '../../../src/utils.js';

const Hasher2 = artifacts.require('Hasher2');
contract('Hasher', () => {
  it('should return correct hash value', async () => {
    const hasher2Contract = await Hasher2.deployed();
    let zero = '0x09f658457775074ff4c842032a5ec2f1134c32784cca59d594caac8c503b7923';
    const hash = await hasher2Contract.poseidon([zero, zero]);
    expect(toFixedLenHex(new BN(hash))).to.equal(
      '0x1a77569b79cb7c2eaf9368de9e3b1efc0a606561e5ab299c2337340f3cdd576a',
    );
  });
});